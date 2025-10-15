import { useState } from "react";
import { Upload, XCircle, Loader } from "lucide-react";

export default function CameraFeeds({ onAnalyze, isLoading, error }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleRemoveVideo = () => {
    setSelectedFile(null);
    setFileName("");
    document.getElementById('video-upload-input').value = ""; // Reset file input
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onAnalyze(selectedFile);
    }
  };

  return (
    <div className="bg-neutral-900/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700 space-y-6">
      <h2 className="text-xl font-bold tracking-wide">📹 Upload CCTV Video for Analysis</h2>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <label className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl cursor-pointer hover:bg-blue-500 transition">
          <Upload className="w-4 h-4" />
          Choose Video
          <input
            id="video-upload-input"
            type="file"
            accept="video/mp4,video/x-m4v,video/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </label>
        
        {fileName && (
          <div className="flex items-center gap-2 text-sm text-neutral-300">
            <span>Selected: {fileName}</span>
            <button onClick={handleRemoveVideo} disabled={isLoading}>
              <XCircle className="w-4 h-4 text-red-500 hover:text-red-400" />
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedFile || isLoading}
        className="w-full flex items-center justify-center gap-2 bg-green-600 px-4 py-3 rounded-xl hover:bg-green-500 transition disabled:bg-neutral-600 disabled:cursor-not-allowed font-semibold text-lg"
      >
        {isLoading ? (
          <>
            <Loader className="animate-spin w-5 h-5" />
            Analyzing... (This may take a minute)
          </>
        ) : (
          "Start Analysis"
        )}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-900/40 rounded-lg border border-red-600 text-red-300">
          <p className="font-semibold">Analysis Failed</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="relative rounded-xl overflow-hidden shadow-lg bg-black w-full max-w-4xl mx-auto">
        <div className="h-[400px] flex items-center justify-center text-neutral-400 bg-neutral-800/50 rounded-xl border border-dashed border-neutral-600">
          Upload a video and click "Start Analysis" to see the results on the Analytics page.
        </div>
      </div>
    </div>
  );
}
