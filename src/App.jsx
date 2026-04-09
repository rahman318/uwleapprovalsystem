// src/App.jsx

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import MyRequests from "./pages/MyRequests";
import StaffForm from "./pages/StaffForm";
import ApproverDashboard from "./pages/ApproverDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// ==================== Helper ====================
// Convert base64 VAPID public key ke Uint8Array
function urlBase64ToUint8Array(base64String) {
  if (!base64String) return null;
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ==================== AppRoutes ====================
const AppRoutes = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  });

  // ==================== Auto redirect & PWA Push ====================
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

    // ======= PWA PUSH SUBSCRIBE =======
    const subscribeUser = async () => {
      if (!("serviceWorker" in navigator && "PushManager" in window)) return;

      try {
        // Tunggu SW ready (fully activated)
        const reg = await navigator.serviceWorker.ready;
        console.log("✅ Service Worker ready:", reg);

        // Ambil VAPID key dari Vite env
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          console.warn("❌ VAPID key missing, cannot subscribe user");
          return;
        }

        // Subscribe user
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        console.log("📡 Subscription object:", subscription);

        // Hantar subscription ke backend
        const res = await fetch("https://uwleapprovalsystem.onrender.com/api/save-subscription", {
          method: "POST",
          body: JSON.stringify(subscription),
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        console.log("📥 Backend response:", data);

      } catch (err) {
        console.error("❌ PWA Push subscription error:", err);
      }
    };

    subscribeUser();
  }, [user, navigate]);

  // ==================== Logout ====================
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  // ==================== Render ====================
  return (
    <>
      {/* Optional Logout */}
      {user && (
        <div className="p-4 bg-gray-100 text-right">
          <span className="mr-4 font-semibold">{user.username} ({user.role})</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Log Keluar
          </button>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login setUser={setUser} />} />

        <Route
          path="/staff"
          element={user?.role === "staff" ? <StaffForm /> : <Navigate to="/login" />}
        />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route
          path="/approver"
          element={user?.role === "approver" ? <ApproverDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/technician"
          element={user?.role === "technician" ? <TechnicianDashboard /> : <Navigate to="/login" />}
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
};

// ==================== Main App ====================
const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;
