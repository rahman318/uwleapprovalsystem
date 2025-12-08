import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

    try {
      // 🔹 Endpoint sementara tanpa token
      const res = await axios.post(
        `https://backenduwleapprovalsystem.onrender.com/api/auth/reset-password-no-token`,
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
        err.response?.data?.message || "Reset gagal.",
        "error"
      );
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
          />
          <label className="block mb-2 text-sm font-medium text-gray-700">Sahkan Kata Laluan</label>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ulang kata laluan baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            Reset Kata Laluan
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
