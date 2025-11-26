import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const RegisterUserForm = () => {
  const [formData, setFormData] = useState({
    username: "",   // ✅ align dengan schema
    email: "",
    password: "",
    role: "staff",
    department: "", // optional ikut schema
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );
     Swal.fire({
  icon: "success",
  title: "User Berjaya Daftar",
  text: `User ${res.data.username} (${res.data.role}) telah berjaya daftar`,
  timer: 2000,
  showConfirmButton: false,
})

      // reset form
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "staff",
        department: "",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Daftar",
        text: err.response?.data?.msg || "Server error",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md mt-6">
      <h2 className="text-lg font-bold mb-4">Daftar User Baru</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Nama
          </label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Nama"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Emel */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Emel
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Emel"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Kata Laluan */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Kata Laluan
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Kata Laluan"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Department (optional) */}
        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium mb-1"
          >
            Jabatan
          </label>
          <input
            type="text"
            id="department"
            name="department"
            placeholder="Contoh: IT / HR"
            value={formData.department}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="staff">Staff</option>
            <option value="approver">Approver</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Daftar User
        </button>
      </form>
    </div>
  );
};

export default RegisterUserForm;