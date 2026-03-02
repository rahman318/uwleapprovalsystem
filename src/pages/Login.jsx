import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      // redirect ikut role
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

  // ================== UI ==================
  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center font-[Inter] bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/system.jpg')",
      }}
    >
      {/* semi-transparent overlay supaya form readable */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 flex flex-col items-center mb-6">
        <img
          src="/company logo.png"
          alt="Company Logo"
          className="h-16 w-auto mb-2 z-10"
        />
        <h1 className="text-2xl font-bold text-white tracking-wide z-10">
          E-Approval & Maintenance Portal
        </h1>

        {/* SMART Analytics Button */}
        <button
          onClick={handleAnalyticsClick}
          className="mt-4 bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 transition font-medium shadow-sm z-10"
        >
          View Analytics
        </button>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/90 p-6 rounded-2xl shadow-lg border border-blue-100">
        <h2 className="text-xl font-semibold text-center text-blue-700 mb-4">
          Log Masuk Akaun
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              placeholder="Masukkan emel anda"
              className="w-full border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 p-2 rounded-lg outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Kata Laluan
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Masukkan kata laluan"
              className="w-full border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 p-2 rounded-lg outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition font-medium shadow-sm"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          <Link to="/forgot-password" className="text-blue-600 hover:underline font-medium">
            Lupa kata laluan?
          </Link>
        </p>
      </div>
    </div>
  );
}
