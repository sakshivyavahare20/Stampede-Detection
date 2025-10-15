export default function Topbar({ selectedCamera, setSelectedCamera }) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-xl font-bold">Live Crowd Monitor Dashboard</h1>
      <div className="flex items-center space-x-2">
        <select
          className="bg-neutral-800 p-2 rounded-lg"
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
        >
          <option>Camera Feed 1 (Main Hall)</option>
          <option>Camera Feed 2 (Central Plaza)</option>
        </select>
        <button className="bg-blue-600 px-3 py-2 rounded-lg">Apply Filters</button>
      </div>
    </div>
  );
}
