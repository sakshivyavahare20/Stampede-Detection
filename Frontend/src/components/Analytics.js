import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Sample data for crowd density trend (current and previous hour)
const densityTrend = [
  { time: "12:00", value: 25 },
  { time: "12:20", value: 40 },
  { time: "12:40", value: 70 },
  { time: "01:00", value: 50 },
];
const densityTrendPrevious = [
  { time: "12:00", value: 20 },
  { time: "12:20", value: 35 },
  { time: "12:40", value: 65 },
  { time: "01:00", value: 55 },
];

// Risk level distribution pie chart data
const riskDistribution = [
  { name: "Safe", value: 33 },
  { name: "Congested", value: 27 },
  { name: "High Risk", value: 40 },
];
const COLORS = ["#00C49F", "#FFBB28", "#FF4444"];

// Zone status data with people count and risk status color
const zoneStatus = [
  { zone: "Entrance Hall", status: "Safe", people: 12, color: "text-green-400" },
  {
    zone: "Central Plaza",
    status: "Congested",
    people: 48,
    color: "text-yellow-400",
  },
  { zone: "Exit Gate", status: "Safe", people: 7, color: "text-green-400" },
  {
    zone: "North Corridor",
    status: "Congested",
    people: 25,
    color: "text-yellow-400",
  },
  {
    zone: "Main Auditorium",
    status: "High Risk",
    people: 98,
    color: "text-red-500",
  },
  { zone: "Restroom Area", status: "Safe", people: 5, color: "text-green-400" },
];

// Sample engagement metrics (e.g., session check-ins)
const engagementMetrics = {
  sessionCheckIns: 152,
  surveyResponses: 87,
  appInteractions: 310,
};

// Sample financial overview data
const financialOverview = {
  ticketSales: 450,
  revenue: 12345.6,
  refunds: 12,
};

export default function Analytics() {
  // Example state for alert visibility (could be driven by real-time data)
  const [showHighRiskAlert, setShowHighRiskAlert] = useState(true);

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-6 py-8">
      {/* Real-time High Risk Alert */}
      {showHighRiskAlert && (
        <div
          className="bg-red-700 text-white px-5 py-4 rounded-lg shadow-lg flex justify-between items-center"
          role="alert"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="font-semibold text-lg">
              High crowd risk detected in "Main Auditorium"! Take action to
              reduce congestion.
            </p>
          </div>
          <button
            aria-label="Dismiss alert"
            onClick={() => setShowHighRiskAlert(false)}
            className="text-white hover:text-red-300 font-bold text-xl"
          >
            &times;
          </button>
        </div>
      )}

      {/* Zone Risk Status */}
      <section className="bg-neutral-900/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span role="img" aria-label="chart">
            📊
          </span>{" "}
          Zone Risk Status
        </h2>
        <ul className="space-y-3 text-sm font-medium text-gray-300">
          {zoneStatus.map((zone, idx) => (
            <li
              key={idx}
              className="flex justify-between items-center rounded-md px-3 py-2 hover:bg-neutral-800 transition-colors cursor-default select-none"
            >
              <span className="truncate">{zone.zone}</span>
              <span className={`${zone.color} font-semibold`}>
                {zone.status} <span className="text-gray-400">({zone.people})</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Line Chart: Crowd Density (Current vs Previous Hour) */}
        <article className="bg-neutral-900/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span role="img" aria-label="line chart">
              📈
            </span>{" "}
            Crowd Density Trend (Last Hour)
          </h2>
          <LineChart
            width={350}
            height={220}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="time" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                borderRadius: "6px",
                borderColor: "#4B5563",
              }}
              itemStyle={{ color: "#e0e7ff" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              data={densityTrend}
              stroke="#4F9DFF"
              strokeWidth={3}
              dot={{ r: 5 }}
              name="Current Hour"
            />
            <Line
              type="monotone"
              dataKey="value"
              data={densityTrendPrevious}
              stroke="#FFD700"
              strokeWidth={3}
              dot={{ r: 5 }}
              strokeDasharray="5 5"
              name="Previous Hour"
            />
          </LineChart>
        </article>

        {/* Pie Chart: Risk Level Distribution */}
        <article className="bg-neutral-900/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span role="img" aria-label="pie chart">
              🟢
            </span>{" "}
            Risk Level Distribution
          </h2>
          <PieChart width={350} height={220} className="self-center">
            <Pie
              data={riskDistribution}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label
              labelLine={false}
              fill="#8884d8"
              aria-label="Risk distribution pie chart"
            >
              {riskDistribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                borderRadius: "6px",
                borderColor: "#4B5563",
              }}
              itemStyle={{ color: "#e0e7ff" }}
            />
          </PieChart>
        </article>
      </section>

      {/* Additional Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Engagement Metrics */}
        <div className="bg-neutral-900/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700 text-gray-300">
          <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
          <ul className="space-y-2 text-sm font-medium">
            <li>
              Session Check-Ins:{" "}
              <span className="text-blue-400 font-bold">
                {engagementMetrics.sessionCheckIns}
              </span>
            </li>
            <li>
              Survey Responses:{" "}
              <span className="text-green-400 font-bold">
                {engagementMetrics.surveyResponses}
              </span>
            </li>
            <li>
              App Interactions:{" "}
              <span className="text-yellow-400 font-bold">
                {engagementMetrics.appInteractions}
              </span>
            </li>
          </ul>
        </div>

        {/* Financial Overview */}
        <div className="bg-neutral-900/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700 text-gray-300">
          <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
          <ul className="space-y-2 text-sm font-medium">
            <li>
              Ticket Sales:{" "}
              <span className="text-blue-400 font-bold">
                {financialOverview.ticketSales}
              </span>
            </li>
            <li>
              Revenue:{" "}
              <span className="text-green-400 font-bold">
                ${financialOverview.revenue.toLocaleString()}
              </span>
            </li>
            <li>
              Refunds:{" "}
              <span className="text-red-400 font-bold">
                {financialOverview.refunds}
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
