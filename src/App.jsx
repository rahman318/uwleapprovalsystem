// src/App.jsx
import React, { useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "../utils/AuthContext";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ApproverDashboard from "./pages/ApproverDashboard";
import StaffForm from "./pages/StaffForm";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import MyRequests from "./pages/MyRequests";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Helper
function urlBase64ToUint8Array(base64String) {
  if (!base64String) return null;
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// AppRoutes
const AppRoutes = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;

    // Redirect based on role
    switch (user.role) {
      case "admin": navigate("/admin"); break;
      case "approver": navigate("/approver"); break;
      case "staff": navigate("/staff"); break;
      case "technician": navigate("/technician"); break;
      default: navigate("/login");
    }

    // ================= PWA PUSH =================
    const subscribeUser = async () => {
      if (!("serviceWorker" in navigator && "PushManager" in window)) return;

      try {
        const reg = await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller) {
          setTimeout(subscribeUser, 1000);
          return;
        }

        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) return;

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        const subJSON = subscription.toJSON();
        // Manual fetch test
        await fetch("https://uwleapprovalsystem.onrender.com/api/save", {
          method: "POST",
          body: JSON.stringify(subJSON),
          headers: { "Content-Type": "application/json" },
        });

      } catch (err) {
        console.error("❌ PWA Push subscription error:", err);
      }
    };
    setTimeout(subscribeUser, 500);

  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <>
      {user && (
        <div className="p-4 bg-gray-100 text-right">
          <span className="mr-4 font-semibold">{user.username} ({user.role})</span>
          <button onClick={handleLogout} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
            Log Keluar
          </button>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/staff" element={user?.role === "staff" ? <StaffForm /> : <Navigate to="/login" />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/approver" element={user?.role === "approver" ? <ApproverDashboard /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/technician" element={user?.role === "technician" ? <TechnicianDashboard /> : <Navigate to="/login" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
};

// Main App
const App = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;
