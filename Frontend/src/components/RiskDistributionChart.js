import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const riskDistribution = [
  { name: "Safe Zones", value: 33 },
  { name: "Congested Zones", value: 27 },
  { name: "High Risk Zones", value: 40 },
];

const COLORS = ["#00C49F", "#FFBB28", "#FF4444"];

export default function RiskDistributionChart() {
  return (
    <div className="bg-neutral-900 p-6 rounded-xl shadow-lg border border-neutral-700">
      <h2 className="text-lg font-semibold mb-4">⚠️ Risk Level Distribution</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={riskDistribution}
            cx="50%"
            cy="50%"
            outerRadius={90}
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {riskDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [`${value}%`, name]} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
      <p className="mt-3 text-sm text-neutral-400">
        Current distribution of safe, congested, and high-risk areas across the station.
      </p>
    </div>
  );
}
