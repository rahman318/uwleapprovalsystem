// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import MyRequests from "./pages/MyRequests";
import StaffForm from "./pages/StaffForm";
import ApproverDashboard from "./pages/ApproverDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// ==================== Helper ====================
function urlBase64ToUint8Array(base64String) {
  if (!base64String) return null;
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ==================== AppRoutes ====================
const AppRoutes = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  });

  // ==================== SERVICE WORKER ====================
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => {
          console.log("🔥 SERVICE WORKER REGISTERED:", reg);

          navigator.serviceWorker.ready.then(() => {
            console.log("✅ Service Worker READY");
          });
        })
        .catch((err) => {
          console.error("❌ SERVICE WORKER FAILED:", err);
        });
    }
  }, []);

  // ==================== PUSH SUBSCRIBE ====================
  const subscribeUser = async () => {
    if (!user) return;

    if (!("serviceWorker" in navigator && "PushManager" in window)) {
      console.log("❌ Push not supported");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        console.log("❌ Missing VAPID KEY");
        return;
      }

      // 🔥 DEVICE ID
      let deviceId = localStorage.getItem("deviceId");

      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("deviceId", deviceId);
      }

      let subscription = await reg.pushManager.getSubscription();

      // 🔥 VALIDATE EXISTING SUB
      if (subscription) {
        const subJSON = subscription.toJSON();

        if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
          console.log("⚠️ Invalid subscription, recreating...");
          await subscription.unsubscribe();
          subscription = null;
        } else {
          console.log("ℹ️ Using existing subscription");

          await fetch("https://backenduwleapprovalsystem.onrender.com/api/subscription/save-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user._id,
              role: user.role,
              deviceId,
              subscription: subJSON,
            }),
          });

          return;
        }
      }

      // 🔔 request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("❌ Notification denied");
        return;
      }

      // 📡 create new subscription
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      console.log("📡 New subscription created");

      await fetch("https://backenduwleapprovalsystem.onrender.com/api/subscription/save-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          role: user.role,
          deviceId,
          subscription: subscription.toJSON(),
        }),
      });

      console.log("✅ Subscription saved");

    } catch (err) {
      console.error("❌ Push subscription error:", err);
    }
  };

  // ==================== AUTO LOGIN + AUTO REFRESH ====================
  useEffect(() => {
    if (!user) return;

    // 🔀 redirect ikut role
    if (location.pathname === "/" || location.pathname === "/login") {
      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "approver":
          navigate("/approver");
          break;
        case "staff":
          navigate("/staff");
          break;
        case "technician":
          navigate("/technician");
          break;
        default:
          navigate("/login");
      }
    }

    // 🔥 subscribe + refresh loop
    subscribeUser();

    const interval = setInterval(() => {
      console.log("🔄 Refreshing subscription...");
      subscribeUser();
    }, 30000); // every 30s

    return () => clearInterval(interval);

  }, [user]);

  // ==================== LOGOUT ====================
  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // 🔥 reset deviceId (avoid cross-user conflict)
      localStorage.removeItem("deviceId");

      sessionStorage.clear();

      console.log("🚪 Logout success");

      navigate("/login");

    } catch (err) {
      console.error("❌ Logout error:", err);
    }
  };

  // ==================== UI ====================
  return (
    <>
      {user && (
        <div className="p-4 bg-gray-100 text-right">
          <span className="mr-4 font-semibold">
            {user.username} ({user.role})
          </span>

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

        <Route path="/my-requests" element={<MyRequests user={user} />} />

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

// ==================== MAIN APP ====================
const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;
