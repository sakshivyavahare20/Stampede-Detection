import { useState } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import CameraFeeds from "./components/CameraFeeds";
import PeopleCount from "./components/PeopleCount";
import GridCrowd from "./components/GridCrowd";
import Heatmap from "./components/Heatmap";
import Reports from "./components/Reports";
import PeopleTrendChart from "./components/PeopleTrendChart";
import AlertsPanel from "./components/AlertsPanel";
import DetailedGridChart from "./components/DetailedGridChart";
import LiveAnalysis from "./components/LiveAnalysis";

function App() {
  const [activePage, setActivePage] = useState("camera");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  const [selectedCell, setSelectedCell] = useState(null);
  const [detailedCellData, setDetailedCellData] = useState([]);
  
  // --- NEW: State to hold alerts from the live feed ---
  const [liveAlerts, setLiveAlerts] = useState([]);

  const handleAnalyzeVideo = async (file) => {
    if (!file) {
      setError("Please select a video file first.");
      return;
    }
    setIsLoading(true);
    setError("");
    setResults(null);
    setSelectedCell(null);
    setDetailedCellData([]);
    setLiveAlerts([]); // Clear live alerts when starting a new batch analysis

    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post("http://127.0.0.1:8000/analyze/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("✅ [App.js] SUCCESS: Data received from backend:", response.data);
      setResults(response.data);
      setActivePage("analytics");
    } catch (err) {
      console.error("❌ [App.js] ERROR: Failed to get data from backend:", err);
      setError(err.response?.data?.detail || "An error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGridCellClick = (row, col) => {
    if (!results || !results.grid_counts_over_time) return;
    const cellData = results.grid_counts_over_time.map(gridFrame => gridFrame?.[row]?.[col] ?? 0);
    setDetailedCellData(cellData);
    setSelectedCell({ row, col });
  };

  const handleCloseDetailedChart = () => {
    setSelectedCell(null);
    setDetailedCellData([]);
  };

  // --- NEW: Clear live alerts when navigating away from the live page ---
  const handlePageChange = (page) => {
    if (activePage === 'live' && page !== 'live') {
      setLiveAlerts([]);
    }
    setActivePage(page);
  };

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      <Sidebar activePage={activePage} setActivePage={handlePageChange} />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {activePage === "camera" && (
          <CameraFeeds
            onAnalyze={handleAnalyzeVideo}
            isLoading={isLoading}
            error={error}
          />
        )}
        {activePage === "analytics" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Crowd Analytics Results</h1>
            {results ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PeopleCount summary={results.summary} />
                  <PeopleTrendChart data={results.people_count_by_second} />
                </div>
                <GridCrowd
                  videoSrc={results.processed_video_url}
                  alerts={results.alerts}
                  onGridCellClick={handleGridCellClick}
                  gridDimensions={results.grid_dimensions}
                />
                <Heatmap
                  heatmapSrc={results.heatmap_image_url}
                  prediction={results.prediction}
                />
              </>
            ) : (
              <div className="text-center py-10 bg-neutral-900 rounded-lg">
                <p className="text-neutral-400">
                  Please upload a video on the Camera Feeds page to see the analysis.
                </p>
              </div>
            )}
          </div>
        )}
        {/* MODIFIED: Pass the alert setter to the LiveAnalysis component */}
        {activePage === "live" && <LiveAnalysis setLiveAlerts={setLiveAlerts} />}
        
        {activePage === "reports" && <Reports />}
      </main>
      
      {/* MODIFIED: Combine batch results alerts with live alerts */}
      <AlertsPanel alerts={[...(results?.alerts ?? []), ...liveAlerts]} />

      <DetailedGridChart 
        data={detailedCellData}
        selectedCell={selectedCell}
        onClose={handleCloseDetailedChart}
      />
    </div>
  );
}

export default App;

