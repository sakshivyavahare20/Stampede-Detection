import cv2
import numpy as np
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
from scipy.ndimage import gaussian_filter
from collections import deque
import os
import uuid
import base64
import subprocess
import logging
import time

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- SETTINGS ---
CONFIDENCE_THRESHOLD = 0.65
CELL_DENSITY_THRESHOLD = 6
UNSAFE_DURATION = 1.5
GRID_MIN = 3
GRID_MAX = 8
DEFAULT_GRID = 4
GRID_SCALE_FACTOR = 1.5
PREDICTION_HORIZON_SECONDS = 30
PREDICTION_HISTORY_FRAMES = 45

SPEED_THRESHOLD_LOW = 15
SPEED_THRESHOLD_HIGH = 50

# --- NEW: Frame skipping for live analysis performance ---
LIVE_ANALYSIS_FRAME_SKIP = 2 # Analyzes 1 frame for every X frames skipped

# --- LOAD MODELS (loaded once) ---
logger.info("Loading YOLO model...")
MODEL_PATH = "best_final.pt"
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = "best.pt"
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("YOLO model not found.")
model = YOLO(MODEL_PATH)

# --- HELPER FUNCTIONS ---
def create_smooth_heatmap_overlay(grid_counts, width, height, grid_rows, grid_cols, is_prediction=False):
    max_val = np.max(grid_counts)
    if max_val == 0:
        if is_prediction:
            base_color = np.full((height, width, 3), (150, 0, 0), dtype=np.uint8)
            return cv2.GaussianBlur(base_color, (31, 31), 0)
        return np.zeros((height, width, 3), dtype=np.uint8)
    blocky_heatmap = cv2.resize(grid_counts.astype(np.float32), (width, height), interpolation=cv2.INTER_NEAREST)
    kernel_size = max(5, int(width / grid_cols // 2) * 2 + 1)
    blurred_heatmap = cv2.GaussianBlur(blocky_heatmap, (kernel_size, kernel_size), 0)
    norm_heatmap = cv2.normalize(blurred_heatmap, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    return cv2.applyColorMap(norm_heatmap, cv2.COLORMAP_JET)

def get_zone_name(gx, gy, grid_size):
    row_pos = "Top" if gy < grid_size / 3 else "Bottom" if gy >= grid_size * 2 / 3 else "Middle"
    col_pos = "Left" if gx < grid_size / 3 else "Right" if gx >= grid_size * 2 / 3 else "Center"
    if row_pos == "Middle" and col_pos == "Center": return "Central Area"
    return f"{row_pos}-{col_pos} Zone"

def predict_future_heatmap(historical_grids: deque, grid_shape: tuple, fps: float):
    if len(historical_grids) < PREDICTION_HISTORY_FRAMES: return None
    history_array = np.array(list(historical_grids))
    velocities = np.diff(history_array, axis=0).mean(axis=0)
    last_known_grid = historical_grids[-1]
    predicted_grid = last_known_grid + (velocities * 1.5 * int(PREDICTION_HORIZON_SECONDS * fps))
    predicted_grid[predicted_grid < 0] = 0
    high_risk_zones = [[r, c] for r in range(grid_shape[0]) for c in range(grid_shape[1]) if predicted_grid[r, c] >= CELL_DENSITY_THRESHOLD]
    return {"high_risk_zones": high_risk_zones, "expected_max_density": int(np.max(predicted_grid)), "predicted_grid_counts": predicted_grid}

# --- LIVE STREAM PROCESSING CLASS ---
class LiveStreamProcessor:
    def __init__(self):
        self.tracker = DeepSort(max_age=30)
        self.track_history = {}
        self.unsafe_active = {}
        self.GRID_SIZE = DEFAULT_GRID
        self.frame_idx = 0
        self.last_grid_calc_time = 0
        self.heatmap_acc = None
        self.live_people_counts = []
        self.grid_history = deque(maxlen=PREDICTION_HISTORY_FRAMES)
        self.last_known_tracks = [] # NEW: To store tracks for skipped frames

    def analyze_frame(self, frame):
        self.frame_idx += 1
        frame_h, frame_w, _ = frame.shape
        video_fps = 25.0

        if self.heatmap_acc is None:
            self.heatmap_acc = np.zeros((frame_h, frame_w), dtype=np.float32)

        vis = frame.copy()
        live_alerts = []
        
        # --- MODIFIED: Only run heavy analysis periodically ---
        if self.frame_idx % (LIVE_ANALYSIS_FRAME_SKIP + 1) == 0:
            if time.time() - self.last_grid_calc_time > 10:
                self.last_grid_calc_time = time.time()
                results_grid = model(frame, verbose=False, half=True)[0]
                person_heights = [b.xyxy[0][3] - b.xyxy[0][1] for b in results_grid.boxes if b.conf > CONFIDENCE_THRESHOLD and model.names[int(b.cls)] == "person"]
                if person_heights:
                    avg_h = np.mean(person_heights)
                    raw_grid = int(frame_h / (avg_h * GRID_SCALE_FACTOR + 1e-8))
                    self.GRID_SIZE = max(GRID_MIN, min(raw_grid, GRID_MAX))

            results = model(frame, verbose=False, half=True)[0]
            detections = [(list(map(int, b.xyxy[0].cpu().numpy())), float(b.conf), "person") for b in results.boxes if b.conf > CONFIDENCE_THRESHOLD and model.names[int(b.cls)] == "person"]
            tracks = self.tracker.update_tracks(detections, frame=frame)
            self.last_known_tracks = [tr for tr in tracks if tr.is_confirmed()]
        
        frame_tracks = self.last_known_tracks
        self.live_people_counts.append(len(frame_tracks))
        
        cell_w, cell_h = max(1, frame_w // self.GRID_SIZE), max(1, frame_h // self.GRID_SIZE)
        grid_counts = np.zeros((self.GRID_SIZE, self.GRID_SIZE), dtype=int)
        
        for tr in frame_tracks:
            x1, y1, x2, y2 = map(int, tr.to_tlbr())
            cx = (x1 + x2) // 2
            cy = y1 + int((y2 - y1) * 0.8)
            if 0 <= cx < frame_w and 0 <= cy < frame_h:
                gx, gy = min(cx // cell_w, self.GRID_SIZE - 1), min(cy // cell_h, self.GRID_SIZE - 1)
                grid_counts[gy, gx] += 1
                self.heatmap_acc[cy, cx] += 1.0

        self.grid_history.append(grid_counts)
        heatmap_overlay = create_smooth_heatmap_overlay(grid_counts, frame_w, frame_h, self.GRID_SIZE, self.GRID_SIZE)
        cv2.addWeighted(heatmap_overlay, 0.4, vis, 0.6, 0, vis)
        
        for gy in range(self.GRID_SIZE):
            for gx in range(self.GRID_SIZE):
                count = int(grid_counts[gy, gx])
                is_unsafe = count >= CELL_DENSITY_THRESHOLD
                if is_unsafe and (gx, gy) not in self.unsafe_active:
                    self.unsafe_active[(gx, gy)] = self.frame_idx
                    live_alerts.append({"id": f"live-dense-{gx}-{gy}", "type": "High Risk Detected", "message": f"Congestion in {get_zone_name(gx, gy, self.GRID_SIZE)}"})
                elif not is_unsafe and (gx, gy) in self.unsafe_active:
                    del self.unsafe_active[(gx, gy)]
                color = (0, 0, 255) if is_unsafe else (0, 200, 0)
                cv2.rectangle(vis, (gx * cell_w, gy * cell_h), (gx * cell_w + cell_w, gy * cell_h + cell_h), color, 1)
                text_pos = (gx * cell_w + 5, gy * cell_h + 20)
                cv2.putText(vis, str(count), text_pos, cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,0), 4)
                cv2.putText(vis, str(count), text_pos, cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        current_track_ids = set()
        for tr in frame_tracks:
            if tr.track_id is not None:
                current_track_ids.add(tr.track_id)
                x1, y1, x2, y2 = map(int, tr.to_tlbr())
                if tr.get_det_conf() is not None:
                    label = f"P: {tr.get_det_conf():.2f}"
                    cv2.rectangle(vis, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                    cv2.rectangle(vis, (x1, y1 - h - 10), (x1 + w, y1 - 5), (0, 255, 0), cv2.FILLED)
                    cv2.putText(vis, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                center_x, center_y = (x1 + x2) // 2, y1 + int((y2 - y1) * 0.8)
                if tr.track_id not in self.track_history: self.track_history[tr.track_id] = deque(maxlen=15)
                self.track_history[tr.track_id].append((center_x, center_y))
                if len(self.track_history[tr.track_id]) > 10:
                    history = self.track_history[tr.track_id]
                    dx, dy = history[-1][0] - history[0][0], history[-1][1] - history[0][1]
                    magnitude = np.sqrt(dx**2 + dy**2)
                    if magnitude > 5:
                        arrow_color = (0, 255, 0)
                        if magnitude > SPEED_THRESHOLD_HIGH: arrow_color = (0, 0, 255)
                        elif magnitude > SPEED_THRESHOLD_LOW: arrow_color = (0, 255, 255)
                        
                        norm_dx, norm_dy = dx / magnitude, dy / magnitude
                        end_point = (center_x + int(norm_dx * 15), center_y + int(norm_dy * 15))
                        cv2.arrowedLine(vis, (center_x, center_y), end_point, arrow_color, 2, tipLength=0.5)

        for track_id in list(self.track_history.keys()):
            if track_id not in current_track_ids: del self.track_history[track_id]
        
        total_count = len(frame_tracks)
        cv2.putText(vis, f"Total Count: {total_count}", (40, frame_h - 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0,0,0), 6)
        cv2.putText(vis, f"Total Count: {total_count}", (40, frame_h - 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255,255,255), 2)
        
        analysis_data = {"total_count": total_count, "alerts": live_alerts}
        
        if self.frame_idx % 50 == 0:
            if np.any(self.heatmap_acc):
                heatmap_blurred = gaussian_filter(self.heatmap_acc, sigma=20)
                vmax = np.percentile(heatmap_blurred, 99.9)
                if vmax > 0:
                    hm_norm = (255 * np.clip(heatmap_blurred, 0, vmax) / vmax).astype(np.uint8)
                    hm_color = cv2.applyColorMap(hm_norm, cv2.COLORMAP_JET)
                    _, buffer = cv2.imencode('.png', hm_color)
                    analysis_data['liveHeatmap'] = f"data:image/png;base64,{base64.b64encode(buffer).decode('utf-8')}"

            prediction_results = predict_future_heatmap(self.grid_history, (self.GRID_SIZE, self.GRID_SIZE), video_fps)
            if prediction_results:
                predicted_grid = prediction_results.get("predicted_grid_counts", np.zeros((self.GRID_SIZE, self.GRID_SIZE)))
                predicted_heatmap_img = create_smooth_heatmap_overlay(predicted_grid, frame_w, frame_h, self.GRID_SIZE, self.GRID_SIZE, is_prediction=True)
                _, buffer = cv2.imencode('.png', predicted_heatmap_img)
                prediction_b64 = base64.b64encode(buffer).decode('utf-8')
                risk_level = "High" if prediction_results.get("high_risk_zones") else "Low"
                analysis_data['livePrediction'] = {"heatmap_prediction_b64": prediction_b64, "expected_risk_level": risk_level}

            if self.live_people_counts:
                avg_count = np.mean(self.live_people_counts)
                analysis_data['chartDataPoint'] = {"count": round(avg_count, 2)}
                self.live_people_counts = []
        
        analysis_data['grid_counts'] = grid_counts.tolist()
        analysis_data['grid_dimensions'] = {"rows": self.GRID_SIZE, "cols": self.GRID_SIZE}

        return vis, analysis_data


# --- BATCH VIDEO PROCESSING FUNCTION ---
def process_video(video_in_path: str):
    cap = cv2.VideoCapture(video_in_path)
    if not cap.isOpened(): raise FileNotFoundError(f"Cannot open video: {video_in_path}")

    video_fps = float(cap.get(cv2.CAP_PROP_FPS) or 25.0)
    frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    all_person_heights = []
    for _ in range(int(video_fps * 3)):
        ret, frame = cap.read()
        if not ret: break
        results = model(frame, verbose=False)[0]
        for box in results.boxes:
            if box.conf[0] > CONFIDENCE_THRESHOLD and model.names[int(box.cls[0])] == "person":
                _, y1, _, y2 = box.xyxy[0].cpu().numpy()
                all_person_heights.append(y2 - y1)

    GRID_SIZE = DEFAULT_GRID
    if all_person_heights:
        avg_h = float(np.mean(all_person_heights))
        raw_grid = int(frame_h / (avg_h * GRID_SCALE_FACTOR + 1e-8))
        GRID_SIZE = max(GRID_MIN, min(raw_grid, GRID_MAX))
    
    logger.info(f"Dynamic grid size calculated: {GRID_SIZE}x{GRID_SIZE}")
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

    unique_id = uuid.uuid4().hex
    video_out_path = os.path.join("outputs", f"output_{unique_id}.mp4")
    heatmap_out_path = os.path.join("outputs", f"heatmap_{unique_id}.png")
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_out_path, fourcc, video_fps, (frame_w, frame_h))
    
    heatmap_acc, unsafe_active, unsafe_events, people_counts_per_frame = np.zeros((frame_h, frame_w), dtype=np.float32), {}, [], []
    grid_history, track_history = deque(maxlen=PREDICTION_HISTORY_FRAMES), {}
    grid_counts_over_time = []
    frame_idx = 0
    
    batch_tracker = DeepSort(max_age=30)

    while True:
        ret, frame = cap.read()
        if not ret: break
        frame_idx += 1
        
        results = model(frame, verbose=False)[0]
        detections = [(list(map(int, b.xyxy[0].cpu().numpy())), float(b.conf), "person") for b in results.boxes if b.conf > CONFIDENCE_THRESHOLD and model.names[int(b.cls)] == "person"]
        
        tracks = batch_tracker.update_tracks(detections, frame=frame)
        frame_tracks = [tr for tr in tracks if tr.is_confirmed()]
        people_counts_per_frame.append(len(frame_tracks))
        
        vis = frame.copy()
        
        cell_w, cell_h = max(1, frame_w // GRID_SIZE), max(1, frame_h // GRID_SIZE)
        grid_counts = np.zeros((GRID_SIZE, GRID_SIZE), dtype=int)
        for tr in frame_tracks:
            x1, y1, x2, y2 = map(int, tr.to_tlbr())
            cx = (x1 + x2) // 2
            cy = y1 + int((y2 - y1) * 0.8)
            if 0 <= cx < frame_w and 0 <= cy < frame_h:
                gx, gy = min(cx // cell_w, GRID_SIZE - 1), min(cy // cell_h, GRID_SIZE - 1)
                grid_counts[gy, gx] += 1
                heatmap_acc[cy, cx] += 1.0

        grid_history.append(grid_counts)
        grid_counts_over_time.append(grid_counts.tolist())
        
        heatmap_overlay = create_smooth_heatmap_overlay(grid_counts, frame_w, frame_h, GRID_SIZE, GRID_SIZE)
        cv2.addWeighted(heatmap_overlay, 0.4, vis, 0.6, 0, vis)

        for gy in range(GRID_SIZE):
            for gx in range(GRID_SIZE):
                count = int(grid_counts[gy, gx])
                is_unsafe = count >= CELL_DENSITY_THRESHOLD
                if is_unsafe:
                    if (gx, gy) not in unsafe_active: unsafe_active[(gx, gy)] = frame_idx
                elif (gx, gy) in unsafe_active:
                    start_f = unsafe_active.pop((gx, gy))
                    if (frame_idx - start_f) / video_fps >= UNSAFE_DURATION:
                        unsafe_events.append(((gx, gy), start_f / video_fps, frame_idx / video_fps))
                
                color = (0, 0, 255) if is_unsafe else (0, 200, 0)
                cv2.rectangle(vis, (gx * cell_w, gy * cell_h), (gx * cell_w + cell_w, gy * cell_h + cell_h), color, 1)

                text_pos = (gx * cell_w + 5, gy * cell_h + 20)
                cv2.putText(vis, str(count), text_pos, cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,0), 4)
                cv2.putText(vis, str(count), text_pos, cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        current_track_ids = set()
        for tr in frame_tracks:
            if tr.track_id is not None:
                current_track_ids.add(tr.track_id)
                x1, y1, x2, y2 = map(int, tr.to_tlbr())
                
                if tr.get_det_conf() is not None:
                    label = f"P: {tr.get_det_conf():.2f}"
                    cv2.rectangle(vis, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                    cv2.rectangle(vis, (x1, y1 - h - 10), (x1 + w, y1 - 5), (0, 255, 0), cv2.FILLED)
                    cv2.putText(vis, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                center_x, center_y = (x1 + x2) // 2, y1 + int((y2 - y1) * 0.8)
                if tr.track_id not in track_history: track_history[tr.track_id] = deque(maxlen=15)
                track_history[tr.track_id].append((center_x, center_y))
                
                if len(track_history[tr.track_id]) > 10:
                    history = track_history[tr.track_id]
                    dx, dy = history[-1][0] - history[0][0], history[-1][1] - history[0][1]
                    magnitude = np.sqrt(dx**2 + dy**2)
                    if magnitude > 5:
                        arrow_color = (0, 255, 0)
                        if magnitude > SPEED_THRESHOLD_HIGH: arrow_color = (0, 0, 255)
                        elif magnitude > SPEED_THRESHOLD_LOW: arrow_color = (0, 255, 255)

                        norm_dx, norm_dy = dx / magnitude, dy / magnitude
                        end_point = (center_x + int(norm_dx * 15), center_y + int(norm_dy * 15))
                        cv2.arrowedLine(vis, (center_x, center_y), end_point, arrow_color, 2, tipLength=0.5)

        for track_id in list(track_history.keys()):
            if track_id not in current_track_ids: del track_history[track_id]
        
        total_count = len(frame_tracks)
        cv2.putText(vis, f"Total Count: {total_count}", (40, frame_h - 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0,0,0), 6)
        cv2.putText(vis, f"Total Count: {total_count}", (40, frame_h - 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255,255,255), 2)
        out.write(vis)

    cap.release(), out.release()
    logger.info(f"Raw video processing complete. Saved to {video_out_path}")

    temp_video_path = video_out_path.replace(".mp4", "_temp_final.mp4")
    os.rename(video_out_path, temp_video_path)
    logger.info("Running ffmpeg to optimize video for web streaming...")
    try:
        ffmpeg_command = ["ffmpeg","-y","-i",temp_video_path,"-c:v","libx264","-preset","veryfast","-pix_fmt","yuv420p","-movflags","+faststart",video_out_path]
        subprocess.run(ffmpeg_command, check=True, capture_output=True, text=True)
        os.remove(temp_video_path)
    except Exception as e:
        logger.error(f"FFmpeg failed: {e}")
        os.rename(temp_video_path, video_out_path)

    people_count_by_second = []
    if people_counts_per_frame and video_fps > 0:
        for i in range(0, len(people_counts_per_frame), int(video_fps)):
            chunk = people_counts_per_frame[i:i + int(video_fps)]
            if chunk: people_count_by_second.append({"second": i // int(video_fps), "count": round(np.mean(chunk), 2)})

    for (gx, gy), start_f in list(unsafe_active.items()):
        if (frame_idx - start_f) / video_fps >= UNSAFE_DURATION:
            unsafe_events.append(((gx, gy), start_f / video_fps, frame_idx / video_fps))

    prediction_results = predict_future_heatmap(grid_history, (GRID_SIZE, GRID_SIZE), video_fps)
    final_prediction_data = {"prediction_horizon": f"{PREDICTION_HORIZON_SECONDS}s", "high_risk_zones": [], "expected_risk_level": "Low", "expected_max_density": 0, "heatmap_prediction_b64": None}
    predicted_grid_for_heatmap = np.zeros((GRID_SIZE, GRID_SIZE))

    if prediction_results:
        predicted_grid_for_heatmap = prediction_results.pop("predicted_grid_counts", predicted_grid_for_heatmap)
        final_prediction_data.update(prediction_results)

    predicted_heatmap_img = create_smooth_heatmap_overlay(predicted_grid_for_heatmap, frame_w, frame_h, GRID_SIZE, GRID_SIZE, is_prediction=True)
    _, buffer = cv2.imencode('.png', predicted_heatmap_img)
    final_prediction_data["heatmap_prediction_b64"] = base64.b64encode(buffer).decode('utf-8')

    if np.any(heatmap_acc):
        heatmap_blurred = gaussian_filter(heatmap_acc, sigma=20)
        vmax = np.percentile(heatmap_blurred, 99.9)
        if vmax > 0:
            hm_norm = (255 * np.clip(heatmap_blurred, 0, vmax) / vmax).astype(np.uint8)
            cv2.imwrite(heatmap_out_path, cv2.applyColorMap(hm_norm, cv2.COLORMAP_JET))
    
    unsafe_report = [{"id": f"unsafe-{i}", "type": "High Risk Event", "message": f"High density in {get_zone_name(gx, gy, GRID_SIZE)} (Grid {gx},{gy}) from {start_t:.1f}s to {end_t:.1f}s"} for i, ((gx, gy), start_t, end_t) in enumerate(unsafe_events)]
    
    summary = {"max_people_detected": max(people_counts_per_frame, default=0), "avg_people_detected": np.mean(people_counts_per_frame) if people_counts_per_frame else 0}
    
    return {
        "processed_video_url": video_out_path.replace("\\", "/"), "heatmap_image_url": heatmap_out_path.replace("\\", "/"),
        "alerts": unsafe_report, "summary": summary, "prediction": final_prediction_data,
        "people_count_by_second": people_count_by_second, "grid_counts_over_time": grid_counts_over_time,
        "grid_dimensions": {"rows": GRID_SIZE, "cols": GRID_SIZE}
    }

