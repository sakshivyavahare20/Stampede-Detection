export default function RiskStatus() {
  return (
    <div className="bg-neutral-900 p-4 rounded-lg">
      <h2 className="font-semibold mb-2">Zone Risk Status</h2>
      <ul className="space-y-1 text-sm">
        <li>Entrance Hall - <span className="text-green-400">Safe (12)</span></li>
        <li>Central Plaza - <span className="text-yellow-400">Congested (48)</span></li>
        <li>Exit Gate - <span className="text-green-400">Safe (7)</span></li>
        <li>North Corridor - <span className="text-yellow-400">Congested (25)</span></li>
        <li>Main Auditorium - <span className="text-red-500">High Risk (98)</span></li>
        <li>Restroom Area - <span className="text-green-400">Safe (5)</span></li>
      </ul>
    </div>
  );
}
