import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams(); // ambil token dari URL
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Kalau user akses route tanpa token langsung
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md text-center">
          <h2 className="text-xl font-semibold mb-4">Token Tidak Ditemui / Tidak Sah</h2>
          <p>Sila klik link reset password yang diterima melalui email atau minta reset baru.</p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reset Semula Kata Laluan
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      Swal.fire("Oops!", "Sila isi semua medan kata laluan.", "warning");
      return;
    }
    if (password !== confirmPassword) {
      Swal.fire("Oops!", "Kata laluan tidak sepadan!", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `https://backenduwleapprovalsystem.onrender.com/api/auth/reset-password/${token}`,
        { password }
      );

      Swal.fire({
        icon: "success",
        title: "Berjaya!",
        text: res.data.message || "Kata laluan anda telah ditukar.",
        timer: 2000,
        showConfirmButton: false,
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err.response || err);

      Swal.fire(
        "Ralat!",
        err.response?.data?.message || "Token tidak sah atau telah tamat tempoh.",
        "error"
      );

      setTimeout(() => {
        navigate("/forgot-password");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Reset Kata Laluan</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium text-gray-700">Kata Laluan Baru</label>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan kata laluan baru"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <label className="block mb-2 text-sm font-medium text-gray-700">Sahkan Kata Laluan</label>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ulang kata laluan baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className={`w-full py-2 rounded-lg text-white transition ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
            disabled={loading}
          >
            {loading ? "Processing..." : "Reset Kata Laluan"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
