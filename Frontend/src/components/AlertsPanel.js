import { Bell, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

// NEW: Helper to determine icon and style based on alert type
const getAlertStyle = (type) => {
  if (type.includes("High Risk")) {
    return {
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      bg: "bg-red-900/40",
    };
  }
  if (type.includes("Stampede")) {
    return {
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
      bg: "bg-orange-900/40",
    }
  }
  // Default or Congested
  return {
    icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    bg: "bg-yellow-900/40",
  };
};

export default function AlertsPanel({ alerts = [] }) { // MODIFIED: Accept alerts as props
  return (
    <aside className="w-80 bg-neutral-950 p-4 border-l border-neutral-800 flex flex-col">
      <h2 className="font-semibold mb-3 flex items-center gap-2 text-lg">
        <Bell className="w-5 h-5 text-blue-400" /> Alert Notifications
      </h2>
      <div className="flex-1 overflow-y-auto">
        {alerts.length > 0 ? (
          <ul className="space-y-3 text-sm">
            {alerts.map((alert) => {
              const style = getAlertStyle(alert.type);
              return (
                <li
                  key={alert.id}
                  className={`p-3 rounded flex items-start gap-2 ${style.bg}`}
                >
                  {style.icon}
                  <span>
                    <span className="font-bold">{alert.type}:</span> {alert.message}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-neutral-500 text-sm h-full flex items-center justify-center text-center">
            No alerts to display. Analysis has not been run or no significant events were detected.
          </div>
        )}
      </div>
      <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm disabled:bg-neutral-700" disabled={alerts.length === 0}>
        View All Alerts
      </button>
    </aside>
  );
}
