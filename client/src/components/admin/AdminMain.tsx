// import React from "react";

// import { useAuth } from "@/context/AuthContext";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   User,
//   Shield,
//   Users,
//   Settings,
//   Loader2,
//   Brain,
//   CheckCircle,
//   XCircle,
//   AlertTriangle,
//   Search,
// } from "lucide-react";
// import { motion } from "framer-motion";

// import DashboardLayout from "@/components/DashboardLayout";
// import AdminPsychiatristApprovals from "@/components/admin/AdminPsychiatristApprovals";
// import AdminUserManagement from "@/components/admin/AdminUserManagement";
// import AdminSettings from "@/components/admin/AdminSettings";

// // Mock data for psychiatrists pending approval
// const MOCK_PENDING_PSYCHIATRISTS = [
//   {
//     id: "1",
//     name: "Dr. Sarah Johnson",
//     email: "sarah.johnson@example.com",
//     expertise: "Clinical Psychology",
//     dateApplied: "2023-03-08T10:30:00Z",
//     certificateUrl: "https://example.com/certificates/sarah-johnson.pdf",
//   },
//   {
//     id: "2",
//     name: "Dr. Michael Chen",
//     email: "michael.chen@example.com",
//     expertise: "Neuropsychology",
//     dateApplied: "2023-03-07T14:15:00Z",
//     certificateUrl: "https://example.com/certificates/michael-chen.pdf",
//   },
//   {
//     id: "3",
//     name: "Dr. Emily Rodriguez",
//     email: "emily.rodriguez@example.com",
//     expertise: "Child Psychology",
//     dateApplied: "2023-03-06T09:45:00Z",
//     certificateUrl: "https://example.com/certificates/emily-rodriguez.pdf",
//   },
// ];

// const AdminMain = () => {
//   return (
//     <div>
//       <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-250">
//         {/* Background decorative elements */}
//         <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />
//         <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />

//         {/* Navigation */}
//         <nav className="relative border-b bg-white/80 backdrop-blur-sm">
//           <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               className="flex items-center gap-2 text-gray-900"
//             >
//               <Brain className="h-6 w-6 text-sky-500" />
//               <span className="text-lg font-medium">NeuroAssess</span>
//             </motion.div>

//             <div className="flex items-center gap-4">
//               <div className="text-sm text-gray-600">
//                 Welcome, <span className="font-medium">{user?.name}</span>
//                 <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
//                   Admin
//                 </span>
//               </div>
//               <button
//                 onClick={handleLogout}
//                 className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </nav>

//         {/* Dashboard Content */}
//         <div className="container max-w-6xl mx-auto px-4 py-8">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mb-8"
//           >
//             <h1 className="text-3xl font-bold text-gray-900">
//               Admin Dashboard
//             </h1>
//             <p className="text-gray-600 mt-2">
//               Manage psychiatrists, patients, and system settings
//             </p>
//           </motion.div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             {/* Stats Card - Psychiatrists */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 }}
//               className="bg-white p-6 rounded-2xl shadow-lg shadow-sky-250"
//               onClick={() => setActiveTab("psychiatrists")}
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-500 text-sm">
//                     Psychiatrist Approvals
//                   </p>
//                   <h3 className="text-3xl font-bold text-gray-900 mt-1">3</h3>
//                 </div>
//                 <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
//                   <AlertTriangle className="h-6 w-6 text-amber-500" />
//                 </div>
//               </div>
//               <button
//                 onClick={() => setActiveTab("psychiatrists")}
//                 className={`mt-4 text-sm font-medium ${
//                   activeTab === "psychiatrists"
//                     ? "text-sky-700"
//                     : "text-sky-600 hover:text-sky-700"
//                 }`}
//               >
//                 Manage psychiatrists
//               </button>
//             </motion.div>

//             {/* Stats Card - Users */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2 }}
//               className="bg-white p-6 rounded-2xl shadow-lg shadow-sky-250"
//               onClick={() => setActiveTab("users")}
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-500 text-sm">Total Users</p>
//                   <h3 className="text-3xl font-bold text-gray-900 mt-1">156</h3>
//                 </div>
//                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
//                   <User className="h-6 w-6 text-green-500" />
//                 </div>
//               </div>
//               <button
//                 onClick={() => setActiveTab("users")}
//                 className={`mt-4 text-sm font-medium ${
//                   activeTab === "users"
//                     ? "text-sky-700"
//                     : "text-sky-600 hover:text-sky-700"
//                 }`}
//               >
//                 Manage users
//               </button>
//             </motion.div>

//             {/* Stats Card - Settings */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3 }}
//               className="bg-white p-6 rounded-2xl shadow-lg shadow-sky-250"
//               onClick={() => setActiveTab("settings")}
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-500 text-sm">System Settings</p>
//                   <h3 className="text-3xl font-bold text-gray-900 mt-1">
//                     <Settings className="h-8 w-8 text-gray-700" />
//                   </h3>
//                 </div>
//                 <div className="w-12 h-12 bg-sky-250 rounded-full flex items-center justify-center">
//                   <Settings className="h-6 w-6 text-sky-500" />
//                 </div>
//               </div>
//               <button
//                 onClick={() => setActiveTab("settings")}
//                 className={`mt-4 text-sm font-medium ${
//                   activeTab === "settings"
//                     ? "text-sky-700"
//                     : "text-sky-600 hover:text-sky-700"
//                 }`}
//               >
//                 Configure settings
//               </button>
//             </motion.div>
//           </div>

//           {/* Main Content Area */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4 }}
//             className="bg-white p-6 rounded-2xl shadow-lg shadow-sky-250"
//           >
//             {activeTab === "psychiatrists" && <AdminPsychiatristApprovals />}
//             {activeTab === "users" && <AdminUserManagement />}
//             {activeTab === "settings" && <AdminSettings />}
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminMain;
