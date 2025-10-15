import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const densityTrend = [
  { time: "12:00", crowd: 25 },
  { time: "12:20", crowd: 40 },
  { time: "12:40", crowd: 70 },
  { time: "01:00", crowd: 50 },
];

export default function DensityTrendChart() {
  return (
    <div className="bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-700">
      <h2 className="text-lg font-semibold mb-4">📈 Crowd Density Trend (Last Hour)</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={densityTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="time" stroke="#aaa" />
          <YAxis stroke="#aaa" />
          <Tooltip
            formatter={(value) => [`${value} people`, "Crowd Count"]}
            labelStyle={{ color: "#ddd" }}
          />
          <Line
            type="monotone"
            dataKey="crowd"
            stroke="#4F9DFF"
            strokeWidth={3}
            dot={{ r: 5, fill: "#4F9DFF" }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-3 text-sm text-neutral-400">
        Shows live changes in passenger density over the last hour. A sudden spike indicates congestion risk.
      </p>
    </div>
  );
}
