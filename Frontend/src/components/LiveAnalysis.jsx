import React, { useState, useEffect, useRef } from 'react';
import { Camera, StopCircle, Loader, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DetailedGridChart from './DetailedGridChart';

export default function LiveAnalysis({ setLiveAlerts }) {
  const [isFeedActive, setIsFeedActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [currentCount, setCurrentCount] = useState(0);
  const [internalLiveAlerts, setInternalLiveAlerts] = useState([]);
  const [liveHeatmapSrc, setLiveHeatmapSrc] = useState(null);
  const [livePrediction, setLivePrediction] = useState(null);
  const [liveChartData, setLiveChartData] = useState([]);
  
  const [gridDimensions, setGridDimensions] = useState(null);
  const [selectedLiveCell, setSelectedLiveCell] = useState(null);
  const [detailedLiveCellData, setDetailedLiveCellData] = useState([]);
  const cellHistoryRef = useRef({});

  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const webSocketRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isFeedActive) {
      webSocketRef.current = new WebSocket('ws://127.0.0.1:8000/ws/live');
      
      webSocketRef.current.onopen = () => {
        console.log('✅ WebSocket connection established');
        startSendingFrames();
      };
      
      webSocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.processed_frame && videoRef.current) {
          videoRef.current.src = `data:image/jpeg;base64,${data.processed_frame}`;
        }
        
        const analytics = data.analysis;
        if (typeof analytics.total_count !== 'undefined') setCurrentCount(analytics.total_count);
        
        if (analytics.alerts && analytics.alerts.length > 0) {
          setInternalLiveAlerts(prev => [...prev.slice(-5), ...analytics.alerts]);
          setLiveAlerts(prev => [...prev.slice(-10), ...analytics.alerts]);
        }

        if (analytics.liveHeatmap) setLiveHeatmapSrc(analytics.liveHeatmap);
        if (analytics.livePrediction) setLivePrediction(analytics.livePrediction);
        
        if (analytics.chartDataPoint) {
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const newDataPoint = { ...analytics.chartDataPoint, time: timestamp };
            setLiveChartData(prevData => [...prevData.slice(-9), newDataPoint]);
        }
        
        if (analytics.grid_dimensions) setGridDimensions(analytics.grid_dimensions);
        if (analytics.grid_counts) {
            analytics.grid_counts.forEach((row, r_idx) => {
                row.forEach((count, c_idx) => {
                    const key = `${r_idx}-${c_idx}`;
                    if (!cellHistoryRef.current[key]) cellHistoryRef.current[key] = [];
                    cellHistoryRef.current[key].push(count);
                    if(cellHistoryRef.current[key].length > 50) cellHistoryRef.current[key].shift();
                });
            });
        }
      };

      webSocketRef.current.onerror = (err) => {
        console.error('❌ WebSocket error:', err);
        setError('Connection to the analysis server failed. Please ensure the backend is running.');
        setIsFeedActive(false);
      };

      webSocketRef.current.onclose = () => console.log('WebSocket connection closed.');
    }

    return () => {
      if (webSocketRef.current) webSocketRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if(streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, [isFeedActive, setLiveAlerts]);

  const startSendingFrames = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(videoTrack);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let lastFrameTime = 0;
      const frameInterval = 125; // ~8 FPS

      const sendFrameLoop = async (timestamp) => {
        if (!isFeedActive || !webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
            if(streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
            return;
        };

        if (timestamp - lastFrameTime > frameInterval) {
          lastFrameTime = timestamp;
          
          const frame = await imageCapture.grabFrame();
          canvas.width = frame.width;
          canvas.height = frame.height;
          ctx.drawImage(frame, 0, 0);
          const base64Frame = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          webSocketRef.current.send(JSON.stringify({ image: base64Frame }));
        }
        animationFrameRef.current = requestAnimationFrame(sendFrameLoop);
      };
      
      animationFrameRef.current = requestAnimationFrame(sendFrameLoop);

    } catch (err) {
      console.error('❌ Error accessing webcam:', err);
      setError('Could not access the webcam. Please check permissions.');
      setIsFeedActive(false);
    }
  };

  const handleStartFeed = () => {
    setIsLoading(true);
    setError('');
    setInternalLiveAlerts([]);
    setLiveAlerts([]);
    setCurrentCount(0);
    setLiveChartData([]);
    setLiveHeatmapSrc(null);
    setLivePrediction(null);
    cellHistoryRef.current = {};
    if (navigator.mediaDevices?.getUserMedia) {
      setIsFeedActive(true);
    } else {
      setError('Webcam access is not supported by your browser.');
    }
    setIsLoading(false);
  };

  const handleStopFeed = () => {
    setIsFeedActive(false);
  };
  
  const handleVideoClick = (e) => {
    if (!videoContainerRef.current || !gridDimensions) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / (rect.width / gridDimensions.cols));
    const row = Math.floor(y / (rect.height / gridDimensions.rows));
    const key = `${row}-${col}`;
    setDetailedLiveCellData(cellHistoryRef.current[key] || []);
    setSelectedLiveCell({ row, col });
  };
  
  const handleCloseDetailedChart = () => setSelectedLiveCell(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Live Crowd Monitor</h1>
        {!isFeedActive ? (
          <button onClick={handleStartFeed} disabled={isLoading} className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500 transition disabled:bg-neutral-600 font-semibold">
            {isLoading ? <Loader className="animate-spin" /> : <Camera />} Start Live Feed
          </button>
        ) : (
          <button onClick={handleStopFeed} className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition font-semibold">
            <StopCircle /> Stop Feed
          </button>
        )}
      </div>

      {error && <p className="text-red-400 text-sm p-3 bg-red-900/30 rounded-lg">{error}</p>}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-black rounded-lg overflow-hidden border border-neutral-700 relative cursor-pointer" ref={videoContainerRef} onClick={handleVideoClick}>
          {isFeedActive ? (
            <img ref={videoRef} alt="Live feed" className="w-full h-auto" />
          ) : (
             <div className="h-[480px] flex flex-col items-center justify-center text-neutral-500">
                <Camera size={48} className="mb-4" />
                Live feed is inactive.
             </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-neutral-900 p-4 rounded-lg text-center">
            <p className="text-neutral-400 text-sm">Current People Count</p>
            <p className="text-4xl font-bold text-blue-400">{currentCount}</p>
          </div>
          
          <div className="bg-neutral-900 p-4 rounded-lg">
             <h3 className="text-sm font-semibold text-neutral-300 mb-2">Live Crowd Heatmap</h3>
             {liveHeatmapSrc ? <img src={liveHeatmapSrc} alt="Live Heatmap" className="w-full rounded" /> : <div className="h-24 flex items-center justify-center text-neutral-500 text-xs">Waiting for data...</div>}
          </div>

           <div className="bg-neutral-900 p-4 rounded-lg">
             <h3 className="text-sm font-semibold text-neutral-300 mb-2">Predicted Heatmap (Next 30s)</h3>
             {livePrediction?.heatmap_prediction_b64 ? <img src={`data:image/png;base64,${livePrediction.heatmap_prediction_b64}`} alt="Predicted Heatmap" className="w-full rounded" /> : <div className="h-24 flex items-center justify-center text-neutral-500 text-xs">Waiting for data...</div>}
             <p className="text-xs text-neutral-400 mt-2">Expected Risk: <span className={livePrediction?.expected_risk_level === 'High' ? 'text-red-400' : 'text-green-400'}>{livePrediction?.expected_risk_level || 'N/A'}</span></p>
          </div>

          <div className="bg-neutral-900 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-neutral-300 mb-2">People Count Over Time</h3>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={liveChartData}>
                <XAxis dataKey="time" stroke="#888" fontSize={10} tick={false} />
                <YAxis stroke="#888" fontSize={10} domain={[0, 'dataMax + 5']} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#222", border: "none" }} />
                <Line type="monotone" dataKey="count" stroke="#4F9DFF" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-neutral-900 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-neutral-300 mb-2 flex items-center gap-1"><AlertTriangle size={14} /> Live Alerts</h3>
            {internalLiveAlerts.length > 0 ? <ul className="space-y-2 text-xs text-yellow-300">{internalLiveAlerts.map(alert => <li key={alert.id}>- {alert.message}</li>)}</ul> : <p className="text-xs text-neutral-500">No high-risk events detected.</p>}
          </div>
        </div>
      </div>
      
      <DetailedGridChart data={detailedLiveCellData} selectedCell={selectedLiveCell} onClose={handleCloseDetailedChart} isLive={true} />
    </div>
  );
}

