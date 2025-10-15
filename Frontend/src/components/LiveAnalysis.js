import React, { useState, useRef, useEffect } from 'react';
import { Video, Webcam, StopCircle, AlertTriangle } from 'lucide-react';

// This new component handles all logic for the live webcam analysis
export default function LiveAnalysis() {
    const [isLive, setIsLive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ count: 0, alerts: [] });
    const socketRef = useRef(null);
    const imageRef = useRef(null);

    // Effect to gracefully disconnect the WebSocket when the component unmounts
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    const startWebcamStream = () => {
        setIsLoading(true);
        setError(null);

        // Connect to the new WebSocket endpoint on the backend
        const ws = new WebSocket("ws://127.0.0.1:8000/ws/live_analysis");
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("✅ [LiveAnalysis] WebSocket connection established.");
            setIsLoading(false);
            setIsLive(true);
            // Tell the backend to start using the webcam (source 0)
            ws.send(JSON.stringify({ source: "webcam" }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                setError(data.error);
                stopWebcamStream();
                return;
            }

            // Update the image source with the new frame from the backend
            if (imageRef.current && data.frame) {
                imageRef.current.src = `data:image/jpeg;base64,${data.frame}`;
            }
            // Update the stats
            setStats({
                count: data.total_count,
                alerts: data.alerts || []
            });
        };

        ws.onclose = () => {
            console.log("🔌 [LiveAnalysis] WebSocket connection closed.");
            setIsLive(false);
            setIsLoading(false);
        };

        ws.onerror = (err) => {
            console.error("❌ [LiveAnalysis] WebSocket error:", err);
            setError("Connection to the analysis server failed. Ensure the backend is running.");
            setIsLoading(false);
            setIsLive(false);
        };
    };

    const stopWebcamStream = () => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        setIsLive(false);
        // Reset stats when stopping
        setStats({ count: 0, alerts: [] });
    };

    return (
        <section className="bg-neutral-900/90 rounded-2xl shadow-lg p-6 border border-neutral-700 mb-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Video className="text-blue-400" /> Live Camera Analysis
                </h2>
                <div>
                    {!isLive ? (
                        <button
                            onClick={startWebcamStream}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500 transition disabled:bg-neutral-600 font-semibold"
                        >
                            <Webcam size={20} /> {isLoading ? "Connecting..." : "Start Webcam Feed"}
                        </button>
                    ) : (
                        <button
                            onClick={stopWebcamStream}
                            className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-500 transition font-semibold"
                        >
                            <StopCircle size={20} /> Stop Feed
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-4">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-black rounded-lg overflow-hidden border border-neutral-700 min-h-[480px] flex items-center justify-center">
                    {isLive || isLoading ? (
                        <img ref={imageRef} alt="Live analysis feed" className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-neutral-500 text-center">
                            <Webcam size={48} className="mx-auto mb-2" />
                            Live feed will appear here.
                        </div>
                    )}
                </div>
                
                <div className="space-y-4">
                    <div className="bg-neutral-800 p-4 rounded-lg">
                        <h3 className="font-semibold text-neutral-400 mb-2">Current People Count</h3>
                        <p className="text-5xl font-bold text-blue-400">{stats.count}</p>
                    </div>
                    <div className="bg-neutral-800 p-4 rounded-lg h-96 overflow-y-auto">
                         <h3 className="font-semibold text-neutral-400 mb-2 flex items-center gap-2"><AlertTriangle className="text-yellow-400"/> Live Alerts</h3>
                        {stats.alerts.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {stats.alerts.map(alert => (
                                    <li key={alert.id} className="bg-red-900/50 p-2 rounded-md border border-red-700">
                                        <span className="font-bold">{alert.type}: </span>{alert.message}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-neutral-500 text-sm flex items-center justify-center h-full">
                                No high-risk events detected.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
