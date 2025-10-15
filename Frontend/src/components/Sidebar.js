import { Camera, BarChart3, FileText, LayoutDashboard, Video } from "lucide-react"; // MODIFIED: Imported the 'Video' icon

export default function Sidebar({ activePage, setActivePage }) {
  // MODIFIED: Added "Live Monitor" to the navigation items
  const navItems = [
    // { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "camera", label: "Camera Feeds", icon: <Camera className="w-5 h-5" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "live", label: "Live Monitor", icon: <Video className="w-5 h-5" /> }, // NEW: Live Monitor page link
    { id: "reports", label: "Reports", icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-60 bg-neutral-950 p-4 space-y-6 flex flex-col">
      {/* Logo */}
      <div className="text-blue-400 text-2xl font-bold tracking-wide">
        Crowd<span className="text-white">Sentry</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`flex items-center space-x-2 w-full p-2 rounded-lg transition duration-200 ${
              activePage === item.id
                ? "bg-blue-600 text-white"
                : "hover:bg-neutral-800 text-gray-300"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="text-xs text-neutral-500 border-t border-neutral-800 pt-2">
        © 2025 CrowdSentry
      </div>
    </aside>
  );
}

