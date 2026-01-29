// AdminDashboard.jsx - Full Version with Borders, Hover, Shadow & Export
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import formatDate from "../utils/formatDate";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [staffRequests, setStaffRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterLevel, setFilterLevel] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    department: "",
    level: "",
  });

  const token = localStorage.getItem("token");

  // ================== UTIL ==================
  const getRequestStatus = (request) => {
    if (!request.approvals || request.approvals.length === 0) return "Pending";
    const anyRejected = request.approvals.some((a) => a.status === "Rejected");
    const allApproved = request.approvals.every((a) => a.status === "Approved");
    if (anyRejected) return "Rejected";
    if (allApproved) return "Approved";
    return "Pending";
  };

  const getStatusDisplay = (status) => {
    if (!status) return "-";
    if (status === "Approved")
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
          ✔ Approved
        </span>
      );
    if (status === "Rejected")
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
          ❌ Rejected
        </span>
      );
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
        ⏳ Pending
      </span>
    );
  };

  const getRowColor = (status, index) => {
    let base = index % 2 === 0 ? "bg-gray-50" : "bg-white";
    if (status === "Approved") return "bg-green-50";
    if (status === "Rejected") return "bg-red-50";
    if (status === "Pending") return "bg-yellow-50";
    return base;
  };

  // ================== FETCH ==================
  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================== REGISTER USER ==================
  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.role === "admin" && currentUser?.role !== "admin") {
      return Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Hanya admin boleh daftar admin baru",
      });
    }
    try {
      await axios.post("http://localhost:5000/api/users/register", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({
        icon: "success",
        title: "Pengguna berjaya didaftarkan",
        timer: 1500,
        showConfirmButton: false,
      });
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "staff",
        department: "",
        level: "",
      });
      fetchUsers();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal daftar pengguna" });
    }
  };

  // ================== DELETE ==================
  const handleDeleteUser = async (id) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Padam pengguna?",
      showCancelButton: true,
    });
    if (!confirm.isConfirmed) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal padam pengguna" });
    }
  };

  const handleDeleteRequest = async (id) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Padam permohonan?",
      showCancelButton: true,
    });
    if (!confirm.isConfirmed) return;
    try {
      await axios.delete(`http://localhost:5000/api/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal padam permohonan" });
    }
  };

  // ================== PDF ==================
  const handleDownloadPDF = async (requestId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/requests/${requestId}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "arraybuffer",
        }
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Permohonan_${requestId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Gagal jana PDF" });
    }
  };

  // ================== FILE VIEW / DOWNLOAD ==================
  const handleViewFile = (fileUrl) => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank");
  };

  // ================== EXPORT TO EXCEL ==================
  const exportRequestsToExcel = () => {
    if (!staffRequests || staffRequests.length === 0) {
      Swal.fire({ icon: "info", title: "Tiada data untuk dieksport" });
      return;
    }

    const dataForExcel = staffRequests.map((r) => {
      const status = getRequestStatus(r);
      return {
        "Serial Number": r.serialNumber || "-",
        "Staff Name": r.staffName || "-",
        "Department": r.staffDepartment || "-",
        "Request Type": r.requestType || "-",
        "Status": status,
        "Created At": r.createdAt
          ? new Date(r.createdAt).toLocaleString("ms-MY")
          : "-",
        "Updated At": r.updatedAt
          ? new Date(r.updatedAt).toLocaleString("ms-MY")
          : "-",
        Attachments:
          r.attachments && r.attachments.length
            ? r.attachments.map((a) => a.originalName).join(", ")
            : "-",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff Requests");
    XLSX.writeFile(
      wb,
      `Staff_Requests_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const filteredRequests = filterLevel
    ? staffRequests.filter((r) =>
        r.approvals?.some((a) => a.level?.toString() === filterLevel)
      )
    : staffRequests;

  // ================== UI ==================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-8 text-center">
          Admin Dashboard
        </h1>

        {/* REGISTER USER */}
        <div className="bg-white p-6 rounded-xl shadow mb-10">
          <h2 className="font-semibold mb-4">Daftar Pengguna</h2>
          <form
            onSubmit={handleRegister}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Inputs */}
            <input
              className="border p-2 rounded"
              placeholder="Nama"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <input
              className="border p-2 rounded"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <input
              className="border p-2 rounded"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <input
              className="border p-2 rounded"
              placeholder="Department"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
            />
            <select
              className="border p-2 rounded"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
            >
              <option value="staff">Staff</option>
              <option value="approver">Approver</option>
              <option value="admin">Admin</option>
            </select>
            {formData.role === "approver" && (
              <select
                className="border p-2 rounded"
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e.target.value })
                }
              >
                <option value="">Pilih Level</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
              </select>
            )}
            <button className="bg-blue-600 text-white rounded py-2 font-semibold">
              Daftar
            </button>
          </form>
        </div>

        {/* USERS */}
        <div className="bg-white p-6 rounded-xl shadow mb-10 overflow-x-auto">
          <h2 className="font-semibold mb-4">Senarai Pengguna</h2>
          <table className="w-full text-sm border border-gray-300 border-collapse">
            <thead>
              <tr className="bg-blue-100">
                <th className="p-3 border border-gray-300">Nama</th>
                <th className="p-3 border border-gray-300">Email</th>
                <th className="p-3 border border-gray-300">Role</th>
                <th className="p-3 border border-gray-300">Department</th>
                <th className="p-3 border border-gray-300">Level</th>
                <th className="p-3 border border-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u._id}
                  className={`hover:bg-gray-100 ${
                    u.role === "staff" ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <td className="p-3 border border-gray-300">{u.name}</td>
                  <td className="p-3 border border-gray-300">{u.email}</td>
                  <td className="p-3 border border-gray-300">{u.role}</td>
                  <td className="p-3 border border-gray-300">{u.department || "-"}</td>
                  <td className="p-3 border border-gray-300">
                    {u.role === "approver"
                      ? u.level
                        ? `Level ${u.level}`
                        : "Belum tetapkan"
                      : "-"}
                  </td>
                  <td className="p-3 border border-gray-300 space-x-2">
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* REQUESTS */}
        <div className="bg-white p-6 rounded-xl shadow overflow-x-auto">
          <h2 className="font-semibold mb-4">Staff Requests</h2>

          <div className="mb-4 flex justify-between items-center">
            <div>
              <label>Filter by Level:</label>
              <select
                className="border p-2 rounded ml-2"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
              >
                <option value="">Semua Level</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
              </select>
            </div>

            <button
              onClick={exportRequestsToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              📥 Export to Excel
            </button>
          </div>

          <table className="w-full text-sm border border-gray-300 border-collapse">
            <thead>
              <tr className="bg-blue-100">
                <th className="p-3 border border-gray-300">Serial No</th>
                <th className="p-3 border border-gray-300">Submit Date</th>
                <th className="p-3 border border-gray-300">Staff</th>
                <th className="p-3 border border-gray-300">Jenis</th>
                <th className="p-3 border border-gray-300">File</th>
                <th className="p-3 border border-gray-300">Status</th>
                <th className="p-3 border border-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r, i) => {
                const status = getRequestStatus(r);
                return (
                  <tr
                    key={r._id}
                    className={`hover:bg-gray-100 ${getRowColor(status, i)}`}
                  >
                    <td className="p-3 font-semibold text-blue-700 border border-gray-300">
                      {r.serialNumber || "-"}
                    </td>
                    <td className="p-3 border border-gray-300">
                      {formatDate(r.createdAt, true)}
                    </td>
                    <td className="p-3 border border-gray-300">{r.staffName || "-"}</td>
                    <td className="p-3 border border-gray-300">{r.requestType || "-"}</td>
                    <td className="p-3 border border-gray-300">
                      {r.attachments && r.attachments.length > 0 ? (
                        <ul className="space-y-1">
                          {r.attachments.map((file, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span
                                className="text-blue-700 underline cursor-pointer"
                                onClick={() =>
                                  handleViewFile(
                                    `http://localhost:5000/${file.filePath}`
                                  )
                                }
                              >
                                {file.originalName}
                              </span>
                              <button
                                onClick={() =>
                                  window.open(
                                    `http://localhost:5000/${file.filePath}`,
                                    "_blank"
                                  )
                                }
                                className="bg-green-500 text-white px-2 py-0.5 rounded text-xs"
                              >
                                View
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3 border border-gray-300">{getStatusDisplay(status)}</td>
                    <td className="p-3 border border-gray-300 space-x-2">
                      <button
                        onClick={() => handleDeleteRequest(r._id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        🗑
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(r._id)}
                        className="bg-blue-600 text-white px-2 py-1 rounded"
                      >
                        📄 PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
