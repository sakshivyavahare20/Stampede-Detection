import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { X } from "lucide-react";

export default function DetailedGridChart({ data, selectedCell, onClose }) {
  // Don't render anything if no cell is selected
  if (!selectedCell) {
    return null;
  }

  // Format the data for the chart, adding a 'frame' number for the X-axis
  const chartData = data.map((count, index) => ({
    frame: index,
    count: count,
  }));

  const { row, col } = selectedCell;

  return (
    // Modal container with a semi-transparent background
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg w-full max-w-lg p-6 relative animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-400 hover:text-white transition-colors"
          aria-label="Close detailed view"
        >
          <X size={24} />
        </button>

        {/* Chart Title */}
        <h2 className="text-xl font-bold mb-1 text-white">
          Crowd Trend for Zone ({row}, {col})
        </h2>
        <p className="text-sm text-neutral-400 mb-4">
          Shows the frame-by-frame person count for the selected grid cell.
        </p>

        {/* Responsive Chart Container */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 20,
                left: -10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="frame" stroke="#aaa" label={{ value: 'Frame', position: 'insideBottom', offset: -5 }} />
              <YAxis stroke="#aaa" allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #4B5563", borderRadius: "0.5rem" }}
                labelStyle={{ color: "#ddd" }}
                formatter={(value) => [Math.round(value), "People"]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

