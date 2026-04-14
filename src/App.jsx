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

  useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => {
        console.log("🔥 SERVICE WORKER REGISTERED:", reg);
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

      let subscription = await reg.pushManager.getSubscription();

      // 🔥 sync existing subscription
      if (subscription) {
        console.log("ℹ️ Already subscribed");

        await fetch("https://backenduwleapprovalsystem.onrender.com/api/subscription/save-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            subscription: subscription.toJSON(),
          }),
        });

        return;
      }

      // 🔔 request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("❌ Notification denied");
        return;
      }

      // 📡 subscribe
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      console.log("📡 New subscription created");

      // 💾 save backend
      await fetch("https://backenduwleapprovalsystem.onrender.com/api/subscription/save-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          subscription: subscription.toJSON(),
        }),
      });

      console.log("✅ Subscription saved");

    } catch (err) {
      console.error("❌ Push subscription error:", err);
    }
  };

  //===================== FORCE RESUBSCRIBE ==================
  const subscribePush = async () => {
  const registration = await navigator.serviceWorker.ready;

  // 🔥 unsubscribe lama dulu
  const existingSub = await registration.pushManager.getSubscription();
  if (existingSub) {
    await existingSub.unsubscribe();
    console.log("♻️ Old subscription removed");
  }

  // 🔥 subscribe baru
  const newSub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: "<VAPID_PUBLIC_KEY>"
  });

  console.log("✅ New subscription:", newSub);

  // hantar ke backend
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(newSub)
  });
};

  // ==================== AUTO LOGIN FLOW ====================
  useEffect(() => {
    if (!user) return;

    // 🔀 auto redirect ikut role
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

    // 🚀 push subscribe
    subscribeUser();

  }, [user]); // 🔥 FIX: removed location.pathname

  // ==================== UNSUBSCRIBE ====================
  const unsubscribePush = () => {
    try {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          console.log("🧹 Push unsubscribed");
        }
      });
    } catch (err) {
      console.error("❌ Unsubscribe error:", err);
    }
  };

  // ==================== LOGOUT ====================
  const handleLogout = () => {
    console.log("🚪 Logout clicked");

    // 🔥 non-blocking
    unsubscribePush();

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
    navigate("/login");
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
