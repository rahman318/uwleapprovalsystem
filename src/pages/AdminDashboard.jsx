// AdminDashboard.jsx - FULL version bossskurrr
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import formatDate from "../utils/formatDate";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ================== AnalyticsDashboard ==================
const AnalyticsDashboard = ({ requests }) => {
  const [filterMonth, setFilterMonth] = useState("");
  const [filteredRequests, setFilteredRequests] = useState([]);

  useEffect(() => {
    const filtered = filterMonth
      ? requests.filter((r) => r.createdAt?.startsWith(filterMonth))
      : requests;
    setFilteredRequests(filtered);
  }, [filterMonth, requests]);

  const totalRequests = filteredRequests.length;
  const approvedCount = filteredRequests.filter((r) =>
    r.approvals?.every((a) => a.status === "Approved")
  ).length;
  const rejectedCount = filteredRequests.filter((r) =>
    r.approvals?.some((a) => a.status === "Rejected")
  ).length;
  const pendingCount = totalRequests - approvedCount - rejectedCount;

  const requestTypesCount = {};
  const technicianCount = {};
  const statusCount = {};

  filteredRequests.forEach((r) => {
    requestTypesCount[r.requestType] = (requestTypesCount[r.requestType] || 0) + 1;

    const status =
      r.maintenanceStatus === "Recalled"
        ? "Recalled"
        : r.approvals?.some((a) => a.status === "Rejected")
        ? "Rejected"
        : r.approvals?.every((a) => a.status === "Approved")
        ? "Approved"
        : "Pending";
    statusCount[status] = (statusCount[status] || 0) + 1;

    let techName;
    if (!r.assignedTechnician) {
      techName = "Unassigned";
    } else if (typeof r.assignedTechnician === "object") {
      techName = r.assignedTechnician.username || r.assignedTechnician._id || "Unknown";
    } else {
      techName = r.assignedTechnician;
    }
    technicianCount[techName] = (technicianCount[techName] || 0) + 1;
  });

  const chartRequestTypes = Object.keys(requestTypesCount).map((key) => ({
    name: key,
    count: requestTypesCount[key],
  }));
  const chartStatus = Object.keys(statusCount).map((key) => ({
    name: key,
    count: statusCount[key],
  }));
  const chartTechnician = Object.keys(technicianCount).map((key) => ({
    name: key,
    count: technicianCount[key],
  }));

  const exportToExcel = () => {
    if (!filteredRequests || filteredRequests.length === 0) return alert("Tiada data untuk dieksport");

    const data = filteredRequests.map((r, i) => ({
      No: i + 1,
      "Staff Name": r.staffName || "-",
      Department: r.staffDepartment || "-",
      "Request Type": r.requestType || "-",
      Technician: r.assignedTechnician?.username || "-",
      Status:
        r.maintenanceStatus === "Recalled"
          ? "Recalled"
          : r.approvals?.some((a) => a.status === "Rejected")
          ? "Rejected"
          : r.approvals?.every((a) => a.status === "Approved")
          ? "Approved"
          : "Pending",
      "Created At": r.createdAt ? new Date(r.createdAt).toLocaleString("ms-MY") : "-",
      "Updated At": r.updatedAt ? new Date(r.updatedAt).toLocaleString("ms-MY") : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analytics Requests");
    XLSX.writeFile(
      wb,
      `Analytics_Requests_${filterMonth || "all"}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-10">
      <button
        onClick={exportToExcel}
        className="px-4 py-2 bg-green-600 text-white rounded mb-4"
      >
        Export to Excel
      </button>

      <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>

      <div className="mb-4">
        <label className="font-medium mr-2">Filter by Month:</label>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="border p-1 rounded"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 text-blue-800 p-4 rounded shadow text-center">
          <div className="font-bold text-lg">{totalRequests}</div>
          <div>Total Requests</div>
        </div>
        <div className="bg-green-100 text-green-800 p-4 rounded shadow text-center">
          <div className="font-bold text-lg">{approvedCount}</div>
          <div>Approved</div>
        </div>
        <div className="bg-red-100 text-red-800 p-4 rounded shadow text-center">
          <div className="font-bold text-lg">{rejectedCount}</div>
          <div>Rejected</div>
        </div>
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded shadow text-center">
          <div className="font-bold text-lg">{pendingCount}</div>
          <div>Pending</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-medium mb-2">Requests by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartRequestTypes}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="font-medium mb-2">Requests by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartStatus}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="md:col-span-2">
          <h3 className="font-medium mb-2">Requests per Technician</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartTechnician}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ================== AdminDashboard ==================
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
  const [activeTab, setActiveTab] = useState("dashboard");

  const token = localStorage.getItem("token");

  // ================== FETCH ==================
  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get("https://backenduwleapprovalsystem.onrender.com/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("https://backenduwleapprovalsystem.onrender.com/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get("https://backenduwleapprovalsystem.onrender.com/api/requests", {
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

    // ================== AUTO REFRESH REQUESTS ==================
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================== REGISTER ==================
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
      await axios.post(
        "https://backenduwleapprovalsystem.onrender.com/api/users/register",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
      await axios.delete(`https://backenduwleapprovalsystem.onrender.com/api/users/${id}`, {
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
      await axios.delete(`https://backenduwleapprovalsystem.onrender.com/api/requests/${id}`, {
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
        `https://backenduwleapprovalsystem.onrender.com/api/requests/${requestId}/pdf`,
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

  // ================== VIEW FILE ==================
  const handleViewFile = (fileUrl) => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank");
  };

  // ================== EXPORT EXCEL ==================
  const exportRequestsToExcel = () => {
    if (!staffRequests || staffRequests.length === 0) {
      Swal.fire({ icon: "info", title: "Tiada data untuk dieksport" });
      return;
    }

    const dataForExcel = staffRequests.map((r) => {
      const status =
        r.maintenanceStatus === "Recalled"
          ? "Recalled"
          : r.approvals?.some((a) => a.status === "Rejected")
          ? "Rejected"
          : r.approvals?.every((a) => a.status === "Approved")
          ? "Approved"
          : "Pending";
      return {
        "Serial Number": r.serialNumber || "-",
        "Staff Name": r.staffName || "-",
        "Department": r.staffDepartment || "-",
        "Request Type": r.requestType || "-",
        Status: status,
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

  // ================== STATUS HELPERS ==================
  const getRequestStatus = (request) => {
    if (request.maintenanceStatus === "Recalled") return "Recalled";
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
    if (status === "Recalled")
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
          🔄 Recalled
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
    if (status === "Recalled") return "bg-purple-50";
    return base;
  };

  const filteredRequests = filterLevel
    ? staffRequests.filter(
        (r) => r.approvals?.some((a) => a.level === filterLevel) || r.level === filterLevel
      )
    : staffRequests;

  // ================== RENDER ==================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header + Tabs */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-700">
            Admin Dashboard
          </h1>
          <div className="space-x-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "bg-white border"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded ${
                activeTab === "analytics"
                  ? "bg-green-600 text-white"
                  : "bg-white border"
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <>
            {/* REGISTER USER */}
            <div className="bg-white p-6 rounded-xl shadow mb-10">
              <h2 className="font-semibold mb-4">Daftar Pengguna</h2>
              <form
                onSubmit={handleRegister}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
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
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
                <input
                  className="border p-2 rounded"
                  placeholder="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <select
                  className="border p-2 rounded"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="staff">Staff</option>
                  <option value="technician">Technician</option>
                  <option value="admin">Admin</option>
                </select>
                <input
                  className="border p-2 rounded"
                  placeholder="Department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
                <input
                  className="border p-2 rounded"
                  placeholder="Level"
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({ ...formData, level: e.target.value })
                  }
                />
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Daftar
                  </button>
                </div>
              </form>
            </div>

            {/* REGISTERED USERS TABLE */}
            <div className="bg-white p-6 rounded-xl shadow mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Senarai Pengguna Berdaftar</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-3 py-2 border">No</th>
                      <th className="px-3 py-2 border">Nama</th>
                      <th className="px-3 py-2 border">Email</th>
                      <th className="px-3 py-2 border">Role</th>
                      <th className="px-3 py-2 border">Department</th>
                      <th className="px-3 py-2 border">Level</th>
                      <th className="px-3 py-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={u._id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="px-3 py-2 border">{idx + 1}</td>
                        <td className="px-3 py-2 border">{u.name}</td>
                        <td className="px-3 py-2 border">{u.email}</td>
                        <td className="px-3 py-2 border">{u.role}</td>
                        <td className="px-3 py-2 border">{u.department || "-"}</td>
                        <td className="px-3 py-2 border">{u.level || "-"}</td>
                        <td className="px-3 py-2 border">
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* STAFF REQUESTS TABLE */}
            <div className="bg-white p-6 rounded-xl shadow mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Senarai Permohonan Staff</h2>
                <button
                  onClick={exportRequestsToExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Export Excel
                </button>
              </div>

              <div className="mb-4">
                <label className="mr-2">Filter Level:</label>
                <input
                  type="text"
                  placeholder="Level..."
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="border p-1 rounded"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-3 py-2 border">No</th>
                      <th className="px-3 py-2 border">Staff</th>
                      <th className="px-3 py-2 border">Department</th>
                      <th className="px-3 py-2 border">Type</th>
                      <th className="px-3 py-2 border">Technician</th>
                      <th className="px-3 py-2 border">Status</th>
                      <th className="px-3 py-2 border">Created At</th>
                      <th className="px-3 py-2 border">Updated At</th>
                      <th className="px-3 py-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((r, idx) => {
                      const status = getRequestStatus(r);
                      return (
                        <tr key={r._id} className={getRowColor(status, idx)}>
                          <td className="px-3 py-2 border">{idx + 1}</td>
                          <td className="px-3 py-2 border">{r.staffName || "-"}</td>
                          <td className="px-3 py-2 border">{r.staffDepartment || "-"}</td>
                          <td className="px-3 py-2 border">{r.requestType || "-"}</td>
                          <td className="px-3 py-2 border">
                            {r.assignedTechnician?.username || "Unassigned"}
                          </td>
                          <td className="px-3 py-2 border">{getStatusDisplay(status)}</td>
                          <td className="px-3 py-2 border">
                            {r.createdAt ? formatDate(r.createdAt) : "-"}
                          </td>
                          <td className="px-3 py-2 border">
                            {r.updatedAt ? formatDate(r.updatedAt) : "-"}
                          </td>
                          <td className="px-3 py-2 border space-x-2">
                            <button
                              onClick={() => handleDownloadPDF(r._id)}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                            >
                              PDF
                            </button>
                            {r.attachments && r.attachments.length > 0 && (
                              <button
                                onClick={() => handleViewFile(r.attachments[0].fileUrl)}
                                className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
                              >
                                View
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteRequest(r._id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "analytics" && <AnalyticsDashboard requests={staffRequests} />}
      </div>
    </div>
  );
};

export default AdminDashboard;
