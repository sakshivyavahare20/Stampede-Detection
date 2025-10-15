import os
import shutil
from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from analysis import process_video, LiveStreamProcessor # MODIFIED: Import the new class
import logging
import cv2 # MODIFIED: Import cv2
import base64 # MODIFIED: Import base64
import asyncio # MODIFIED: Import asyncio

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create directories if they don't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

app = FastAPI(title="CrowdSentry Analysis API")

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Static File Serving ---
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

@app.get("/")
def read_root():
    return {"message": "CrowdSentry Analysis API is running."}

@app.post("/analyze/")
async def analyze_crowd_video(file: UploadFile = File(...)):
    """
    Endpoint to upload a video, process it, and return analysis results.
    """
    upload_path = os.path.join("uploads", file.filename)
    try:
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File '{file.filename}' uploaded. Starting analysis...")
        
        analysis_results = process_video(upload_path)
        
        logger.info("Analysis complete. Sending results.")
        
        base_url = "http://127.0.0.1:8000/"
        analysis_results["processed_video_url"] = f"{base_url}{analysis_results['processed_video_url']}"
        analysis_results["heatmap_image_url"] = f"{base_url}{analysis_results['heatmap_image_url']}"
        
        return analysis_results
    except FileNotFoundError as e:
        logger.error(f"File not found during processing: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    finally:
        if os.path.exists(upload_path):
            os.remove(upload_path)


# --- NEW: WEBSOCKET ENDPOINT FOR LIVE ANALYSIS ---
@app.websocket("/ws/live_analysis")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection accepted.")
    
    cap = None
    try:
        # Wait for the initial message from the client to select the source
        message = await websocket.receive_json()
        source = message.get("source")

        if source == "webcam":
            # Use the default webcam on the server
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                await websocket.send_json({"error": "Could not open webcam."})
                return
        else:
            # Later, you can add logic for CCTV URLs
            await websocket.send_json({"error": "Invalid source specified."})
            return

        # Each connection gets its own processor instance to maintain state
        processor = LiveStreamProcessor()
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Analyze the current frame
            processed_frame, analysis_data = processor.analyze_frame(frame)

            # Encode the processed frame to JPEG and then to Base64
            _, buffer = cv2.imencode('.jpg', processed_frame)
            frame_b64 = base64.b64encode(buffer).decode('utf-8')

            # Send the frame and analysis data to the client
            await websocket.send_json({
                "frame": frame_b64,
                "total_count": analysis_data["total_count"],
                "alerts": analysis_data["alerts"]
            })
            
            # Allow other tasks to run
            await asyncio.sleep(0.01)

    except WebSocketDisconnect:
        logger.info("WebSocket connection closed by client.")
    except Exception as e:
        logger.error(f"Error in WebSocket: {e}", exc_info=True)
        await websocket.send_json({"error": "An internal error occurred."})
    finally:
        if cap:
            cap.release()
        logger.info("WebSocket resources cleaned up.")
