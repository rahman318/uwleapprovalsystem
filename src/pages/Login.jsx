import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import packageJson from "../../package.json"; // 🔥 ambil version dari package.json

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ================= SMART ANALYTICS BUTTON =================
  const handleAnalyticsClick = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      Swal.fire({
        icon: "info",
        title: "Sila login dahulu",
        text: "Hanya admin boleh akses Analytics Dashboard",
      });
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "Hanya admin boleh akses Analytics Dashboard",
      });
      return;
    }

    navigate("/analytics");
  };

  // ================== LOGIN ==================
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://backenduwleapprovalsystem.onrender.com/api/auth/login",
        { email, password }
      );

      const token = res.data.token;
      const userRaw = res.data.user;

      const user = {
        _id: userRaw._id || userRaw.id,
        username: userRaw.username || userRaw.name || userRaw.email,
        role: (userRaw.role || "staff").toLowerCase(),
        email: userRaw.email,
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user._id);

      if (setUser) setUser(user);

      Swal.fire({
        icon: "success",
        title: "Login Berjaya",
        text: `Selamat datang ${user.username} (${user.role})`,
        timer: 2000,
        showConfirmButton: false,
      });

      switch (user.role) {
        case "staff":
          navigate("/staff");
          break;
        case "approver":
          navigate("/approver");
          break;
        case "admin":
          navigate("/admin");
          break;
        case "technician":
          navigate("/technician");
          break;
        default:
          navigate("/login");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      Swal.fire({
        icon: "error",
        title: "Login Gagal",
        text: err.response?.data?.message || err.message || "Kesalahan server",
      });
    }
  };

return (
  <>
    <div
      className="min-h-screen flex flex-col font-[Inter] bg-cover bg-center relative"
      style={{ backgroundImage: "url('/images/system.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* 🔥 TICKER (FULL WIDTH ATAS) */}
      <div className="w-full overflow-hidden bg-slate-900 text-white py-2 z-10">
        <div className="whitespace-nowrap inline-block animate-ticker">
          🚀 Welcome to e-Approval System &nbsp;&nbsp;&nbsp;
          🚀 Welcome to e-Approval System &nbsp;&nbsp;&nbsp;
          🚀 Welcome to e-Approval System
        </div>
      </div>

      {/* 🔥 CONTENT CENTER AREA */}
      <div className="flex flex-col justify-center items-center flex-1 relative z-10">
        
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/company-logo.png"
            alt="Company Logo"
            className="h-16 w-auto mb-2"
          />
          <h1 className="text-2xl font-bold text-white tracking-wide">
            E-Approval & Maintenance Portal
          </h1>

          {/* Analytics Button */}
          <button
            onClick={handleAnalyticsClick}
            className="mt-4 bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 transition font-medium shadow-sm"
          >
            View Analytics
          </button>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-white/90 p-6 rounded-2xl shadow-lg border border-blue-100">
          <h2 className="text-xl font-semibold text-center text-blue-700 mb-4">
            Log Masuk Akaun
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 p-2 rounded-lg outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kata Laluan
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 p-2 rounded-lg outline-none transition pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-9 text-gray-500"
              >
                {showPassword ? "❌" : "👁️"}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition font-medium shadow-sm"
            >
              Login
            </button>
          </form>

          <p className="text-center mt-4 text-sm text-gray-600">
            <Link to="/forgot-password" className="text-blue-600 hover:underline">
              Lupa kata laluan?
            </Link>
          </p>

          <p className="text-center mt-4 text-xs text-gray-500">
            Version {packageJson.version}
          </p>
        </div>
      </div>
    </div>
  </>
);
