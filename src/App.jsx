import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StaffForm from "./pages/StaffForm";
import ApproverDashboard from "./pages/ApproverDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const AppRoutes = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  });

  // ✅ Auto redirect - fixed supaya reset password tak kacau
  // Dalam App.jsx (paling atas useEffect)
useEffect(() => {
  if (window.location.pathname.startsWith("/reset-password/")) {
    navigate("/reset-password", { replace: true });
  }
}, [navigate])

  useEffect(() => {
    const skipPaths = ["/login", "/forgot-password"];
    const currentPath = window.location.pathname;
    const isResetPassword = currentPath.startsWith("/reset-password");

    const shouldRedirect =
      !skipPaths.includes(currentPath) && !isResetPassword;

    // Kalau belum login tapi akses page protected
    if (!user && shouldRedirect) {
      navigate("/login");
      return;
    }

    // Kalau dah login, route ikut role
    if (user && shouldRedirect) {
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
        default:
          navigate("/login");
      }
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <>
      {/* Optional Logout button */}
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
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ✅ Reset password - wajib exact token */}
        <Route path="/reset-password/:token?" element={<ResetPassword />} />

        <Route
          path="/staff"
          element={user?.role === "staff" ? <StaffForm /> : <Navigate to="/login" />}
        />
        <Route
          path="/approver"
          element={user?.role === "approver" ? <ApproverDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/login" />}
        />

        {/* ✅ Wildcard route - letak PALING BAWAH */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
};

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;
