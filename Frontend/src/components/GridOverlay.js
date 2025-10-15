import { useEffect, useRef } from "react";

export default function GridOverlay({ videoRef, gridData, rows = 4, cols = 4 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const drawOverlay = () => {
      if (!video.videoWidth || !video.videoHeight) {
        requestAnimationFrame(drawOverlay);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      gridData.forEach((count, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = col * cellWidth;
        const y = row * cellHeight;

        let fillColor = "rgba(0,255,0,0.2)";
        if (count > 15) fillColor = "rgba(255,0,0,0.3)";
        else if (count > 8) fillColor = "rgba(255,165,0,0.3)";

        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, cellWidth, cellHeight);

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        ctx.fillStyle = "#fff";
        ctx.font = "14px Arial";
        ctx.fillText(count, x + cellWidth / 2 - 8, y + cellHeight / 2 + 5);
      });

      requestAnimationFrame(drawOverlay);
    };

    drawOverlay();
  }, [videoRef, gridData, rows, cols]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
    />
  );
}
