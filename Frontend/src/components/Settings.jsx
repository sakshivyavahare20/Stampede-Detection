// import { useState } from "react";

// export default function Settings() {
//   const [formData, setFormData] = useState({
//     username: "admin",
//     email: "admin@example.com",
//     notificationsEnabled: true,
//     theme: "dark",
//     alertThresholdDensity: 70,
//   });

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     alert("Settings saved!");
//   };

//   return (
//     <div className="max-w-5xl mx-auto p-6 space-y-8 text-gray-200">
//       <h1 className="text-3xl font-bold mb-4">⚙️ Settings</h1>

//       <form
//         onSubmit={handleSubmit}
//         className="bg-neutral-900/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700 max-w-3xl mx-auto space-y-8"
//       >
//         {/* User Profile */}
//         <section>
//           <h2 className="text-xl font-semibold mb-4 border-b border-neutral-700 pb-2">
//             User Profile
//           </h2>
//           <div className="space-y-4">
//             <label className="block">
//               <span className="text-sm font-medium mb-1 block">Username</span>
//               <input
//                 type="text"
//                 name="username"
//                 value={formData.username}
//                 onChange={handleChange}
//                 placeholder="Enter your username"
//                 required
//                 className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
//               />
//             </label>
//             <label className="block">
//               <span className="text-sm font-medium mb-1 block">Email</span>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="Enter your email address"
//                 required
//                 className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
//               />
//             </label>
//           </div>
//         </section>

//         {/* Notifications */}
//         <section>
//           <h2 className="text-xl font-semibold mb-4 border-b border-neutral-700 pb-2">
//             Notifications
//           </h2>
//           <label className="flex items-center gap-3 text-sm cursor-pointer">
//             <input
//               type="checkbox"
//               name="notificationsEnabled"
//               checked={formData.notificationsEnabled}
//               onChange={handleChange}
//               className="h-5 w-5 rounded border border-neutral-700 bg-neutral-800 text-indigo-500 focus:ring-indigo-500 focus:ring-2 transition"
//             />
//             Enable Email and SMS Notifications
//           </label>
//         </section>

//         {/* Appearance */}
//         <section>
//           <h2 className="text-xl font-semibold mb-4 border-b border-neutral-700 pb-2">
//             Appearance
//           </h2>
//           <label className="block text-sm">
//             <span className="font-medium mb-1 block">Theme</span>
//             <select
//               name="theme"
//               value={formData.theme}
//               onChange={handleChange}
//               className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
//             >
//               <option value="light" className="bg-neutral-800 text-gray-200">
//                 Light Mode
//               </option>
//               <option value="dark" className="bg-neutral-800 text-gray-200">
//                 Dark Mode
//               </option>
//             </select>
//           </label>
//         </section>

//         {/* Alert Thresholds */}
//         <section>
//           <h2 className="text-xl font-semibold mb-4 border-b border-neutral-700 pb-2">
//             Alert Thresholds
//           </h2>
//           <label className="block text-sm">
//             <span className="font-medium mb-1 block">
//               Crowd Density Alert Threshold (%)
//             </span>
//             <input
//               type="number"
//               name="alertThresholdDensity"
//               value={formData.alertThresholdDensity}
//               min={10}
//               max={100}
//               step={1}
//               onChange={handleChange}
//               className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
//             />
//           </label>
//         </section>

//         {/* Submit */}
//         <button
//           type="submit"
//           className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 font-semibold text-white shadow-md transition"
//         >
//           Save Settings
//         </button>
//       </form>
//     </div>
//   );
// }
