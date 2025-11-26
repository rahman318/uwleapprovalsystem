import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [staffRequests, setStaffRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    department: "",
  });

  const token = localStorage.getItem("token");

  const formatDate = (date, withTime = false) => {
    if (!date) return "-";
    const d = new Date(date);
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    if (withTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    return d.toLocaleDateString("ms-MY", options);
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get("https://backenduwleapprovalsystem.onrender.com/api/users/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error("❌ Error fetch current user:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("https://backenduwleapprovalsystem.onrender.com/api/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUsers(res.data);
    } catch (err) {
      console.error("❌ Error fetch users:", err);
    }
  };

const handleViewPDF = async (requestId) => {
  try {
    const res = await axios.get(`https://backenduwleapprovalsystem.onrender.com/api/requests/${requestId}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      responseType: 'blob' // penting untuk PDF
    });

    const file = new Blob([res.data], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(file);
    window.open(fileURL);
  } catch (err) {
    console.error("❌ PDF error:", err);
    Swal.fire({
      icon: "error",
      title: "Gagal buka PDF!",
      text: "Check backend / file not found",
    });
  }
};

  const fetchRequests = async () => {
    try {
      const res = await axios.get("https://backenduwleapprovalsystem.onrender.com/api/requests", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setStaffRequests(res.data);
    } catch (err) {
      console.error("❌ Error fetch requests:", err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.role === "admin" && currentUser?.role !== "admin") {
      return Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Hanya admin boleh daftar admin baru!",
      });
    }

    try {
      const res = await axios.post(
        "https://backenduwleapprovalsystem.onrender.com/api/users/register",
        formData,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      Swal.fire({
        icon: "success",
        title: res.data.message || "Berjaya daftar pengguna!",
        timer: 1500,
        showConfirmButton: false,
      });
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "staff",
        department: "",
      });
      fetchUsers();
    } catch (err) {
      console.error("❌ Register error:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal daftar pengguna",
        text: err.response?.data?.message || "Sila semak semula input anda",
      });
    }
  };

  const getStatusDisplay = (status) => {
    if (!status) return "-";
    const s = status.toLowerCase();
    if (s === "approved")
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">✔ Approved</span>;
    if (s === "rejected")
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">❌ Rejected</span>;
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">⏳ Pending</span>;
  };

  const handleDeleteRequest = async (id) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Padam Request?",
      text: "Request akan dipadam dan tidak boleh dikembalikan!",
      showCancelButton: true,
      confirmButtonText: "Padam",
      cancelButtonText: "Batal",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`https://backenduwleapprovalsystem.onrender.com/api/requests/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        Swal.fire({
          icon: "success",
          title: "Request dipadam",
          timer: 1500,
          showConfirmButton: false,
        });
        setStaffRequests((prev) => prev.filter((r) => r._id !== id));
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Gagal padam request",
        });
      }
    }
  };

  const handleDeleteUser = async (id) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Padam Pengguna?",
      text: "Akaun pengguna akan dipadam dan tidak boleh dikembalikan!",
      showCancelButton: true,
      confirmButtonText: "Padam",
      cancelButtonText: "Batal",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`https://backenduwleapprovalsystem.onrender.com/api/users/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        Swal.fire({
          icon: "success",
          title: "Pengguna berjaya dipadam",
          timer: 1500,
          showConfirmButton: false,
        });

        setUsers((prev) => prev.filter((u) => u._id !== id));
      } catch (err) {
        console.error("❌ Error delete user:", err);
        Swal.fire({
          icon: "error",
          title: "Gagal padam pengguna",
          text: err.response?.data?.message || "Ralat semasa memadam pengguna",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-blue-700 mb-2">Admin Dashboard</h1>
          {currentUser && (
            <p className="text-sm text-gray-600">
              Logged in as: <b>{currentUser.name}</b> ({currentUser.role})
            </p>
          )}
        </div>

        {/* Form Daftar Pengguna */}
        <div className="mb-10 bg-white shadow-lg rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            🧾 Daftar Pengguna Baru
          </h2>
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nama" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="border p-2 rounded-md focus:ring-2 focus:ring-blue-300" required />
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="border p-2 rounded-md focus:ring-2 focus:ring-blue-300" required />
            <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="border p-2 rounded-md focus:ring-2 focus:ring-blue-300" required />
            <input type="text" placeholder="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="border p-2 rounded-md focus:ring-2 focus:ring-blue-300" />
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="border p-2 rounded-md focus:ring-2 focus:ring-blue-300">
              <option value="staff">Staff</option>
              <option value="approver">Approver</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 font-semibold shadow-md transition">
              + Daftar Pengguna
            </button>
          </form>
        </div>

        {/* Senarai Users */}
        <div className="mb-10 bg-white shadow-lg rounded-xl p-6 border border-gray-200 overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">👥 Senarai Pengguna</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-100 text-blue-800 text-left">
                <th className="p-3">Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3">{u.name}</td>
                  <td>{u.email}</td>
                  <td className="capitalize">{u.role}</td>
                  <td>{u.department || "-"}</td>
                  <td>
                    <button onClick={() => handleDeleteUser(u._id)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition">
                      🗑 Padam
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Staff Requests */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">📂 Senarai Staff Requests</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-green-100 text-green-800 text-left">
                <th className="p-3">Nama Staff</th>
                <th>Jenis</th>
                <th>Details</th>
                <th>Approver</th>
                <th>Tempoh Cuti</th>
                <th>Status</th>
                <th>Tarikh Submit</th>
                <th>Fail</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {staffRequests.map((r) => (
                <tr key={r._id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3">{r.userId?.name || r.staffName || "-"}</td>
                  <td>{r.requestType}</td>
                  <td>{r.details || "-"}</td>
                  <td>{r.approver?.username || "-"}</td>
                  <td>
                    {r.requestType === "Cuti"
                      ? `${formatDate(r.leaveStart)} → ${formatDate(r.leaveEnd)}`
                      : "-"}
                  </td>
<td className="p-3 flex space-x-2">
  <button
    onClick={() => handleViewPDF(r._id, r.requestType)}
    className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition"
  >
    📄 View PDF
  </button>

  {(r.status === "Approved" || r.status === "Rejected") && (
    <button
      onClick={() => handleDeleteRequest(r._id)}
      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
    >
      🗑 Padam
    </button>
  )}
</td>
                  <td>{getStatusDisplay(r.status)}</td>
                  <td>{formatDate(r.createdAt, true)}</td>
                  <td>
                    {r.file ? (
                      <a href={r.file} target="_blank" className="text-blue-600 underline hover:text-blue-800">
                        Lihat Fail
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {(r.status === "Approved" || r.status === "Rejected") && (
                      <button
                        onClick={() => handleDeleteRequest(r._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                      >
                        🗑 Padam
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
