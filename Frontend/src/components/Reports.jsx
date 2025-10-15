import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

// Sample Data for historical reports
const crowdTrendData = [
  { date: "2025-09-01", crowdCount: 1200 },
  { date: "2025-09-02", crowdCount: 1850 },
  { date: "2025-09-03", crowdCount: 2100 },
  { date: "2025-09-04", crowdCount: 950 },
  { date: "2025-09-05", crowdCount: 1700 },
];

const riskLevelData = [
  { zone: "Entrance Hall", safe: 320, congested: 120, highRisk: 25 },
  { zone: "Platform 1", safe: 210, congested: 150, highRisk: 60 },
  { zone: "Exit Gate", safe: 500, congested: 80, highRisk: 10 },
];

export default function Reports() {
  const [showExportMsg, setShowExportMsg] = useState(false);

  // Function to handle PDF export
  function handleExportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("🚆 CrowdSentry - Railway Crowd Analysis Report", 14, 20);
    doc.setFontSize(12);
    doc.text("Generated Report - Crowd Monitoring & Stampede Risk Detection", 14, 30);

    doc.setFontSize(14);
    doc.text("1. Daily Passenger Counts", 14, 45);
    autoTable(doc, {
      startY: 50,
      head: [["Date", "Passenger Count"]],
      body: crowdTrendData.map((row) => [row.date, row.crowdCount]),
    });

    doc.setFontSize(14);
    doc.text("2. Zone-wise Risk Summary", 14, doc.lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Zone", "Safe", "Congested", "High Risk"]],
      body: riskLevelData.map((row) => [row.zone, row.safe, row.congested, row.highRisk]),
    });

    doc.save("Railway_Crowd_Report.pdf");
    setShowExportMsg(true);
    setTimeout(() => setShowExportMsg(false), 3000);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 text-gray-200">
      <h1 className="text-3xl font-bold mb-6">📑 Railway Crowd Analysis Reports</h1>

      {/* Crowd Trend Over Time */}
      <section className="bg-neutral-900/90 rounded-2xl shadow-lg p-6 border border-neutral-700">
        <h2 className="text-xl font-semibold mb-4">👥 Daily Passenger Flow</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={crowdTrendData}>
            <CartesianGrid stroke="#444" />
            <XAxis dataKey="date" stroke="#bbb" />
            <YAxis stroke="#bbb" />
            <Tooltip contentStyle={{ backgroundColor: "#222", border: "none" }} />
            <Line
              type="monotone"
              dataKey="crowdCount"
              stroke="#4F9DFF"
              strokeWidth={3}
              dot={{ r: 5, fill: "#4F9DFF" }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-3 text-sm text-neutral-400">
          Shows daily passenger volume trends across the monitored railway station.
        </p>
      </section>

      {/* Zone-wise Risk Levels */}
      <section className="bg-neutral-900/90 rounded-2xl shadow-lg p-6 border border-neutral-700">
        <h2 className="text-xl font-semibold mb-4">⚠️ Zone-wise Risk Levels</h2>
        <ResponsiveContainer width="100%" height={350}>
            <BarChart
            data={riskLevelData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
            <CartesianGrid stroke="#444" strokeDasharray="3 3" />
            <XAxis dataKey="zone" stroke="#bbb" />
            <YAxis stroke="#bbb" />
            <Tooltip contentStyle={{ backgroundColor: "#222", border: "none", color: "#fff" }}/>
            <Legend />
            <Bar dataKey="safe" stackId="a" fill="#00C49F" />
            <Bar dataKey="congested" stackId="a" fill="#FFBB28" />
            <Bar dataKey="highRisk" stackId="a" fill="#FF4444" />
            </BarChart>
        </ResponsiveContainer>
        <p className="mt-3 text-sm text-neutral-400">
          Visualization shows Safe, Congested, and High-Risk zones based on historical data.
        </p>
      </section>

      {/* Export Reports */}
      <section className="text-center space-y-2">
        <button
          onClick={handleExportPDF}
          className="px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2 mx-auto"
        >
          <Download size={18} /> Download Report (PDF)
        </button>
        {showExportMsg && (
          <p className="mt-2 text-green-400">
            ✅ Report downloaded successfully!
          </p>
        )}
      </section>
    </div>
  );
}

