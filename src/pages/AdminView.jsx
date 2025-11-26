import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import AdminDashboard from "./AdminDashboard";
import RegisterUserForm from "../components/RegisterUserForm";

const AdminView = () => {
  const [users, setUsers] = useState([]);

  // Fetch senarai user
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      Swal.fire("Ralat", "Gagal memuatkan senarai pengguna", "error");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Delete user
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Padam pengguna?",
      text: "Tindakan ini tidak boleh diundur.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, padam",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetch(`http://localhost:3000/api/users/${id}`, {
            method: "DELETE",
          });
          Swal.fire("Berjaya", "Pengguna dipadam", "success");
          fetchUsers(); // refresh senarai
        } catch (error) {
          console.error("Error deleting user:", error);
          Swal.fire("Ralat", "Gagal memadam pengguna", "error");
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Ringkasan Admin */}
      <AdminDashboard />

      {/* Register User */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="text-lg font-semibold mb-3">Daftar Pengguna Baru</h2>
        <RegisterUserForm onRegister={fetchUsers} />
      </div>

      {/* Senarai User */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="text-lg font-semibold mb-3">Senarai Pengguna</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Nama</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Peranan</th>
              <th className="border p-2">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td className="border p-2">{user.name}</td>
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2">{user.role}</td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Padam
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border p-2 text-center" colSpan="4">
                  Tiada pengguna
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminView;