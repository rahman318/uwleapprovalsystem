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

  // ==================== REGISTER SERVICE WORKER ====================
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => {
        console.log("🔥 SW REGISTERED:", reg.scope);
      })
      .catch((err) => {
        console.error("❌ SW REGISTER FAILED:", err);
      });
  }, []);

 // ==================== PUSH SUBSCRIBE (FIXED + DEBUG INJECTED) ====================
const subscribeUser = async () => {
  console.log("🔥 STEP 0: subscribeUser CALLED");

  if (!user) {
    console.log("❌ STEP 0.1: NO USER");
    return;
  }

  try {
    console.log("🚀 STEP 1: PUSH FLOW START");

    if (!("serviceWorker" in navigator && "PushManager" in window)) {
      console.log("❌ STEP 1.1: Push not supported");
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    console.log("🚀 STEP 2: SW READY =", reg);

    if (!reg) {
      console.log("❌ STEP 2.1: SW NOT READY");
      return;
    }

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.log("❌ STEP 2.2: MISSING VAPID KEY");
      return;
    }

    let subscription = await reg.pushManager.getSubscription();

    if (subscription) {
      console.log("ℹ️ STEP 3: ALREADY SUBSCRIBED");

      await fetch(
        "https://backenduwleapprovalsystem.onrender.com/api/subscription",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            subscription: subscription.toJSON(),
          }),
        }
      );

      console.log("💾 STEP 3.1: EXISTING SUB SYNCED");
      return;
    }

    console.log("🔔 STEP 3: REQUESTING PERMISSION");
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("❌ STEP 3.1: PERMISSION DENIED");
      return;
    }

    console.log("📡 STEP 4: CREATING SUBSCRIPTION");

    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    console.log("🔥 STEP 5: SUB CREATED =", subscription);

    console.log("📤 STEP 6: SENDING TO BACKEND");

    const res = await fetch(
      "https://backenduwleapprovalsystem.onrender.com/api/subscription",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          subscription: subscription.toJSON(),
        }),
      }
    );

    console.log("🚀 STEP 7: BACKEND RESPONSE =", res);

  } catch (err) {
    console.log("❌ STEP ERROR:", err);
  }
};

  // ==================== AUTO LOGIN + PUSH INIT ====================
  useEffect(() => {
    if (!user) return;

    // 🔀 role redirect
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

    // 🔥 FIX: delay to ensure SW fully ready
    const timer = setTimeout(() => {
      subscribeUser();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user]);

  // ==================== UNSUBSCRIBE ====================
  const unsubscribePush = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
        console.log("🧹 Push unsubscribed");
      }
    } catch (err) {
      console.error("❌ Unsubscribe error:", err);
    }
  };

  // ==================== LOGOUT ====================
  const handleLogout = async () => {
    console.log("🚪 Logout");

    await unsubscribePush();

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
            className="bg-red-600 text-white px-3 py-1 rounded"
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
