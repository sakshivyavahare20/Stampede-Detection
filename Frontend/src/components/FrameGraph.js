import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

function FrameGraph() {
  const [frameData, setFrameData] = useState([]);

  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      setFrameData((prev) => [
        ...prev.slice(-20), // keep last 20 frames
        { frame, count: Math.floor(Math.random() * 50) },
      ]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-neutral-900 p-6 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">People Count Per Frame</h2>
      <LineChart width={500} height={250} data={frameData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="frame" stroke="#aaa" />
        <YAxis stroke="#aaa" />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#4F9DFF" strokeWidth={2} />
      </LineChart>
    </div>
  );
}

export default FrameGraph;
