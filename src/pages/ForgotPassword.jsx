import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom"; // ✅ tambah ni untuk redirect

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate(); // ✅ hook redirect

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      Swal.fire("Oops!", "Sila masukkan emel anda!", "warning");
      return;
    }

    try {
      const res = await axios.post("https://backenduwleapprovalsystem.onrender.com/api/auth/forgot-password", { email });
      Swal.fire({
        icon: "success",
        title: "Berjaya!",
        text: res.data.message || "Sila semak emel anda untuk pautan reset kata laluan.",
        timer: 2000,
        showConfirmButton: false,
      });
      setEmail("");

      // ✅ Auto redirect ke login selepas 2 saat
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      Swal.fire(
        "Ralat!",
        err.response?.data?.message || "Gagal menghantar pautan reset. Sila cuba semula.",
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Lupa Kata Laluan</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium text-gray-700">Alamat Emel</label>
          <input
            type="email"
            className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan emel anda"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Hantar Pautan Reset
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
