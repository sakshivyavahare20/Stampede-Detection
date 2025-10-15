import React from "react";

export default function Heatmap({ heatmapSrc, prediction }) {
  // These logs are crucial for debugging the data flow from the parent component.
  console.log("➡️ [Heatmap.js] Received heatmapSrc prop:", heatmapSrc);
  console.log("➡️ [Heatmap.js] Received prediction prop:", prediction);

  // Robust checks to ensure the sources are valid strings before rendering.
  const hasHeatmap = heatmapSrc && typeof heatmapSrc === 'string' && heatmapSrc.length > 0;
  const hasPredictionImage = prediction?.heatmap_prediction_b64 && typeof prediction.heatmap_prediction_b64 === 'string';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Cumulative Heatmap */}
      <div className="bg-neutral-900 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Cumulative Crowd Density Heatmap</h3>
        {hasHeatmap ? (
          <img
            src={heatmapSrc}
            alt="Cumulative Heatmap"
            className="rounded w-full object-contain"
          />
        ) : (
          <div className="h-64 bg-neutral-800 flex items-center justify-center text-neutral-400 rounded">
            Heatmap will appear here.
          </div>
        )}
      </div>

      {/* Predicted Heatmap */}
      <div className="bg-neutral-900 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">
          Predicted Heatmap (Next {prediction?.prediction_horizon || "N/A"})
        </h3>
        {hasPredictionImage ? (
          <div>
            <img
              src={`data:image/png;base64,${prediction.heatmap_prediction_b64}`}
              alt="Predicted Heatmap"
              className="rounded w-full object-contain"
            />
             <div className="mt-2 text-sm text-neutral-300 space-y-1">
               <p><strong>Expected Risk:</strong> {prediction.expected_risk_level || "N/A"}</p>
             </div>
          </div>
        ) : (
          <div className="h-64 bg-neutral-800 flex items-center justify-center text-neutral-400 rounded">
            Prediction data will appear here.
          </div>
        )}
      </div>
    </div>
  );
}

