import React from "react";

export default function PeopleCount({ summary }) {
  const maxCount = summary ? Math.round(summary.max_people_detected) : 0;
  const avgCount = summary ? summary.avg_people_detected.toFixed(1) : 0;

  return (
    <div className="bg-neutral-900 p-6 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Crowd Count Summary</h2>
      <div className="flex justify-around items-center mt-4">
        <div>
          <p className="text-sm text-neutral-400">Peak Count</p>
          <p className="text-4xl font-bold text-blue-400">{maxCount}</p>
        </div>
        <div>
          <p className="text-sm text-neutral-400">Average Count</p>
          <p className="text-4xl font-bold text-teal-400">{avgCount}</p>
        </div>
      </div>
    </div>
  );
}
