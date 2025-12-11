import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

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

      if (!user._id || !user.username) throw new Error("❌ User object invalid dari backend");

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
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
        default:
          navigate("/login");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Login Gagal",
        text: err.response?.data?.message || err.message || "Kesalahan server",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-blue-100 font-[Inter]">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <img
          src="/company logo.png"
          alt="Company Logo"
          className="h-16 w-auto mb-2"
        />
        <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
          e-Approval Portal
        </h1>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
        <h2 className="text-xl font-semibold text-center text-blue-700 mb-4">
          Log Masuk Akaun
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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

          {/* Password */}
          <div className="relative">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Kata Laluan
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Masukkan kata laluan"
              className="w-full border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 p-2 rounded-lg outline-none transition pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* ✅ Eye Icon */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? (
                // Eye closed SVG
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.973 9.973 0 012.175-5.625m9.7 9.7A3 3 0 1110.125 6.15m3.75 3.75l4.95 4.95m-9.9-9.9l-4.95-4.95"
                  />
                </svg>
              ) : (
                // Eye open SVG
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition font-medium shadow-sm"
          >
            Login
          </button>
        </form>

        {/* Link Lupa Kata Laluan */}
        <p className="text-center mt-4 text-sm text-gray-600">
          <Link
            to="/forgot-password"
            className="text-blue-600 hover:underline font-medium"
          >
            Lupa kata laluan?
          </Link>
        </p>
      </div>
    </div>
  );
}
