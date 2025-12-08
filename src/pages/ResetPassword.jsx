import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams(); // ambil token dari URL
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenValid, setTokenValid] = useState(true); // 🔹 fallback token invalid

  // 🔹 Debug token
  useEffect(() => {
    console.log("Token dari URL:", token);

    if (!token) {
      setTokenValid(false);
    }
  }, [token]);

  if (!tokenValid) {
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

    try {
      const res = await axios.post(
        `https://backenduwleapprovalsystem.onrender.com/api/auth/reset-password/testtoken`,
        { password }
      );

      Swal.fire({
        icon: "success",
        title: "Berjaya!",
        text: res.data.message || "Kata laluan anda telah ditukar.",
        timer: 2000,
        showConfirmButton: false,
      });

      // 🔹 Auto redirect ke login selepas 2 saat
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

      // 🔹 Redirect ke forgot-password selepas token invalid
      setTimeout(() => {
        navigate("/forgot-password");
      }, 3000);
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
