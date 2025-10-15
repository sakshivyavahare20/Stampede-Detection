import React, { useRef } from "react";

export default function GridCrowd({ videoSrc, alerts = [], onGridCellClick, gridDimensions }) {
  const videoContainerRef = useRef(null);

  // This robust check ensures we only render the video when we have a valid URL string.
  const hasVideo = videoSrc && typeof videoSrc === 'string' && videoSrc.length > 0;

  // --- NEW: Click Handler for Interactive Grid ---
  const handleVideoClick = (e) => {
    // Ensure we have the necessary data and a reference to the container
    if (!videoContainerRef.current || !gridDimensions) {
      return;
    }

    // Get the position and size of the video container
    const rect = videoContainerRef.current.getBoundingClientRect();
    
    // Calculate the click coordinates relative to the video container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate the dimensions of each grid cell
    const cellWidth = rect.width / gridDimensions.cols;
    const cellHeight = rect.height / gridDimensions.rows;

    // Determine which grid cell (row and column) was clicked
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);

    // Call the parent function with the selected cell's coordinates
    if (onGridCellClick) {
      onGridCellClick(row, col);
    }
  };

  return (
    <div className="bg-neutral-900 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Processed Video & Event Log</h2>
        {hasVideo && (
            <p className="text-sm text-neutral-400">Click on a grid cell to see a detailed trend.</p>
        )}
      </div>
      
      {/* --- MODIFIED: Added ref and onClick handler --- */}
      <div 
        ref={videoContainerRef}
        onClick={handleVideoClick}
        className="relative rounded-lg overflow-hidden shadow-lg bg-black w-full max-w-4xl mx-auto cursor-pointer"
      >
        {hasVideo ? (
          <video
            // The 'key' prop is crucial for React to re-render the element when src changes.
            key={videoSrc}
            src={videoSrc}
            controls
            autoPlay
            muted
            loop
            className="w-full h-auto max-h-[500px] object-contain pointer-events-none" // pointer-events-none on video so clicks go to the parent div
          />
        ) : (
          <div className="h-[400px] flex items-center justify-center text-neutral-400 bg-neutral-800/50 rounded-xl border border-dashed border-neutral-600">
            Processed video will appear here.
          </div>
        )}
      </div>

      {alerts && alerts.length > 0 ? (
        <div className="mt-4 p-3 bg-red-900/40 rounded-lg border border-red-600">
          <h3 className="font-semibold text-red-300 mb-2">⚠️ Detected Events</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
            {alerts.map((alert) => (
              <li key={alert.id}>{alert.message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-green-900/40 rounded-lg border border-green-600 text-center">
          <p className="font-semibold text-green-300">✅ All zones are safe. No high-risk events detected.</p>
        </div>
      )}
    </div>
  );
}

