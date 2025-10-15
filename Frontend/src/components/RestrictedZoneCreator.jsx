import React, { useState, useRef, useEffect } from 'react';
import { SquarePen, Eraser, CheckCircle } from 'lucide-react';

export default function RestrictedZoneCreator({ onZoneDefined, videoDimensions }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const canvasRef = useRef(null);

  // Effect to draw the polygon on the canvas whenever points change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear the canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (points.length === 0) return;

    // Draw the polygon lines
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    // If drawing, keep the path open. If finished, close it.
    if (!isDrawing && points.length >= 3) {
        ctx.closePath();
    }
    
    // Style the polygon
    ctx.strokeStyle = '#FFD700'; // Gold color for lines
    ctx.lineWidth = 2;
    ctx.stroke();
    
    if (!isDrawing && points.length >= 3) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'; // Semi-transparent gold fill
      ctx.fill();
    }

    // Draw small circles at each vertex to show click points
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
    });

  }, [points, isDrawing, videoDimensions]);

  // Handler for adding a new point to the polygon
  const handleCanvasClick = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPoints([...points, { x, y }]);
  };
  
  // Toggles the drawing mode on/off
  const toggleDrawing = () => {
    if (isDrawing) {
      handleFinishDrawing();
    } else {
      setPoints([]); // Clear previous zone when starting a new one
      setIsDrawing(true);
    }
  };

  // Finalizes the zone and sends the normalized data to the parent App component
  const handleFinishDrawing = () => {
    setIsDrawing(false);
    if (points.length < 3) {
        // If not enough points to make a zone, clear it.
        setPoints([]);
        onZoneDefined(null); 
        return;
    }

    const normalizedPoints = points.map(p => ({
      x: p.x / videoDimensions.width,
      y: p.y / videoDimensions.height
    }));
    onZoneDefined(normalizedPoints);
  };
  
  // Clears the current zone
  const handleClearZone = () => {
    setPoints([]);
    setIsDrawing(false);
    onZoneDefined(null); // Notify parent that the zone is cleared
  };

  return (
    // --- MODIFIED: Added zIndex to ensure canvas is on top and clickable ---
    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-start p-2 pointer-events-none z-10">
      <div className="flex gap-2 bg-black/50 p-2 rounded-lg pointer-events-auto">
        <button
          onClick={toggleDrawing}
          className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
            isDrawing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isDrawing ? <CheckCircle size={16} /> : <SquarePen size={16} />}
          {isDrawing ? 'Finish Zone' : 'Define Restricted Zone'}
        </button>
        {points.length > 0 && !isDrawing && (
          <button
            onClick={handleClearZone}
            className="px-3 py-2 rounded-md text-sm flex items-center gap-2 bg-red-600 hover:bg-red-700 transition-colors"
          >
            <Eraser size={16} />
            Clear Zone
          </button>
        )}
      </div>
      
      {isDrawing && (
        <p className="mt-2 bg-black/50 px-2 py-1 text-xs rounded">
          Click on the video to add points. Click 'Finish Zone' when done.
        </p>
      )}

      <canvas
        ref={canvasRef}
        width={videoDimensions.width}
        height={videoDimensions.height}
        onClick={handleCanvasClick}
        className="absolute top-0 left-0 pointer-events-auto"
        style={{ pointerEvents: isDrawing ? 'auto' : 'none' }} // Only capture clicks when in drawing mode
      />
    </div>
  );
}

