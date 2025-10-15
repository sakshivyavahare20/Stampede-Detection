import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function PeopleTrendChart({ data }) {
  // This robust check ensures we only try to render the chart when 'data' is a non-empty array.
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="bg-neutral-900 p-6 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">People Count Over Time (Per Second)</h2>
      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="second" unit="s" stroke="#aaa" />
            <YAxis stroke="#aaa" allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#222", border: "none" }}
              labelStyle={{ color: "#ddd" }}
              formatter={(value) => [Math.round(value), "People"]}
            />
            <Line type="monotone" dataKey="count" stroke="#4F9DFF" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-neutral-400">
          Chart data is not available.
        </div>
      )}
    </div>
  );
}

