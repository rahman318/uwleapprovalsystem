// AdminDashboard.jsx - FULL + Tabs (Dashboard + Analytics)
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
  const [darkMode, setDarkMode] = useState(false);

  // ================== FILTER ==================
  useEffect(() => {
    const filtered = filterMonth
      ? requests.filter((r) =>
          r.createdAt?.startsWith(filterMonth)
        )
      : requests;

    setFilteredRequests(filtered);
  }, [filterMonth, requests]);

  // ================== COUNTS ==================
  const totalRequests = filteredRequests.length;

  const approvedCount = filteredRequests.filter((r) =>
    r.approvals?.every((a) => a.status === "Approved")
  ).length;

  const rejectedCount = filteredRequests.filter((r) =>
    r.approvals?.some((a) => a.status === "Rejected")
  ).length;

  const pendingCount =
    totalRequests - approvedCount - rejectedCount;

  // ================== MAPS ==================
  const requestTypesCount = {};
  const technicianCount = {};
  const statusCount = {};

  filteredRequests.forEach((r) => {
    // TYPE
    const type = r.requestType || "Unknown";
    requestTypesCount[type] =
      (requestTypesCount[type] || 0) + 1;

    // STATUS
    const status = r.approvals?.some((a) => a.status === "Rejected")
      ? "Rejected"
      : r.approvals?.every((a) => a.status === "Approved")
      ? "Approved"
      : "Pending";

    statusCount[status] =
      (statusCount[status] || 0) + 1;

    // ================= TECHNICIAN (FIXED) =================
    if (
      r.requestType?.toLowerCase() === "maintenance"
    ) {
      if (
        Array.isArray(r.assignedTechnician) &&
        r.assignedTechnician.length > 0
      ) {
        r.assignedTechnician.forEach((tech) => {
          const name =
            tech?.name ||
            tech?.username ||
            tech?.email ||
            "Unknown";

          technicianCount[name] =
            (technicianCount[name] || 0) + 1;
        });
      } else {
        technicianCount["Unassigned"] =
          (technicianCount["Unassigned"] || 0) + 1;
      }
    }
  });

  // ================= CHART DATA =================
  const chartRequestTypes = Object.keys(
    requestTypesCount
  ).map((key) => ({
    name: key,
    count: requestTypesCount[key],
  }));

  const chartStatus = Object.keys(statusCount).map(
    (key) => ({
      name: key,
      count: statusCount[key],
    })
  );

  const chartTechnician = Object.keys(
    technicianCount
  ).map((key) => ({
    name: key,
    count: technicianCount[key],
  }));

  // ================= EXPORT =================
  const exportToExcel = () => {
    if (!filteredRequests.length)
      return alert("Tiada data");

    const data = filteredRequests.map((r, i) => ({
      No: i + 1,
      "Staff Name": r.staffName || "-",
      "Request Type": r.requestType || "-",
      Technician: Array.isArray(r.assignedTechnician)
        ? r.assignedTechnician
            .map(
              (t) =>
                t?.name || t?.username || t?.email || "Unknown"
            )
            .join(", ")
        : "-",
      Status: r.approvals?.some((a) => a.status === "Rejected")
        ? "Rejected"
        : r.approvals?.every((a) => a.status === "Approved")
        ? "Approved"
        : "Pending",
      "Created At": r.createdAt
        ? new Date(r.createdAt).toLocaleString("ms-MY")
        : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analytics");

    XLSX.writeFile(
      wb,
      `analytics_${Date.now()}.xlsx`
    );
  };

  // ================= UI =================
  return (
    <div
      className={
        darkMode
          ? "bg-gray-900 text-white p-6 rounded-xl"
          : "bg-gray-50 text-gray-900 p-6 rounded-xl"
      }
    >
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">
          📊 Analytics Dashboard
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1 bg-gray-300 rounded"
          >
            {darkMode ? "Light" : "Dark"}
          </button>

          <button
            onClick={exportToExcel}
            className="px-3 py-1 bg-green-600 text-white rounded"
          >
            Export
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="mb-4">
        <input
          type="month"
          value={filterMonth}
          onChange={(e) =>
            setFilterMonth(e.target.value)
          }
          className="border p-2 rounded"
        />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: totalRequests },
          { label: "Approved", value: approvedCount },
          { label: "Rejected", value: rejectedCount },
          { label: "Pending", value: pendingCount },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white p-3 rounded shadow text-center"
          >
            <div className="text-xl font-bold">
              {item.value}
            </div>
            <div>{item.label}</div>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TYPE */}
        <div className="bg-white p-3 rounded shadow">
          <h3 className="font-semibold mb-2">
            By Type
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartRequestTypes}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* STATUS */}
        <div className="bg-white p-3 rounded shadow">
          <h3 className="font-semibold mb-2">
            By Status
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartStatus}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TECHNICIAN */}
        <div className="bg-white p-3 rounded shadow lg:col-span-2">
          <h3 className="font-semibold mb-2">
            By Technician
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartTechnician}>
              <XAxis dataKey="name" />
              <YAxis />
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
  const [filterRole, setFilterRole] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
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

  const handleEditUser = (user) => {
  setSelectedUser(user);
  setIsEditOpen(true);
};

  // ================== UPDATE USER ==================
const handleUpdateUser = async () => {
  try {
    await axios.put(
      `https://backenduwleapprovalsystem.onrender.com/api/users/${selectedUser._id}`,
      selectedUser,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    Swal.fire({
      icon: "success",
      title: "User berjaya dikemaskini",
      timer: 1500,
      showConfirmButton: false,
    });

    setIsEditOpen(false);
    fetchUsers();
  } catch (err) {
    Swal.fire({ icon: "error", title: "Gagal update user" });
  }
};

  // ================== DELETE USER ==================
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
      const status = r.approvals?.some((a) => a.status === "Rejected")
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

  // ================== FILTER REQUESTS ==================
  const filteredRequests = filterLevel
    ? staffRequests.filter(
        (r) => r.approvals?.some((a) => a.level === filterLevel) || r.level === filterLevel
      )
    : staffRequests;

  //================= FILTER USER BY ROLE ================
  const filteredUsers = filterRole
  ? users.filter((u) => u.role === filterRole)
  : users;

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
                  <option value="technician">Technician</option>
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
                    <option value="4">Level 4</option>
                  </select>
                )}
                <button className="bg-blue-600 text-white rounded py-2 font-semibold">
                  Daftar
                </button>
              </form>
            </div>

            {/* USERS */}
            <div className="bg-white p-6 rounded-2xl shadow mb-10">
  <div className="flex justify-between items-center mb-6">

<div className="mb-4 flex items-center space-x-3">
  <label className="font-medium">Filter Role:</label>

  <select
    value={filterRole}
    onChange={(e) => setFilterRole(e.target.value)}
    className="border p-2 rounded"
  >
    <option value="">Semua</option>
    <option value="admin">Admin</option>
    <option value="staff">Staff</option>
    <option value="approver">Approver</option>
    <option value="technician">Technician</option>
  </select>
</div>
    
    <h2 className="font-semibold text-lg text-gray-800">
      Senarai Pengguna
    </h2>

    <span className="text-sm text-gray-500">
      Total: {users.length}
    </span>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {filteredUsers.map((user) => (
      <div
        key={user._id}
        className="group bg-gradient-to-br from-white to-gray-50 border rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300"
      >
        {/* Avatar + Name */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition">
              {user.name}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Info */}
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex justify-between">
            <span>Role</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.role === "admin"
                  ? "bg-red-100 text-red-600"
                  : user.role === "approver"
                  ? "bg-yellow-100 text-yellow-700"
                  : user.role === "technician"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {user.role}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Department</span>
            <span className="font-medium text-gray-700">
              {user.department || "-"}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Level</span>
            <span className="font-medium text-gray-700">
              {user.level || "-"}
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="mt-5 flex justify-between items-center">
          <button
            onClick={() => handleDeleteUser(user._id)}
            className="text-red-500 text-xs font-medium hover:underline"
          >
            🗑 Delete
          </button>

          <button
  onClick={() => handleEditUser(user)}
  className="text-blue-500 text-xs font-medium hover:underline"
>
  ✏️ Edit
</button>
        </div>
      </div>
    ))}
  </div>
</div>

            {/* STAFF REQUESTS */}
            <div className="bg-white p-6 rounded-xl shadow mb-10 overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Senarai Permohonan Staff</h2>
                <button
                  onClick={exportRequestsToExcel}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                >
                  Export Excel
                </button>
              </div>

              <div className="mb-4">
                <label className="mr-2 font-medium">Filter by Level:</label>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="border p-1 rounded"
                >
                  <option value="">Semua</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                </select>
              </div>

              <table className="w-full text-sm border border-gray-300 border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="p-2 border">Serial</th>
                    <th className="p-2 border">Staff</th>
                    <th className="p-2 border">Department</th>
                    <th className="p-2 border">Request Type</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Created At</th>
                    <th className="p-2 border">Updated At</th>
                    <th className="p-2 border">Attachments</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req, index) => {
                    const status = getRequestStatus(req);
                    return (
                      <tr key={req._id} className={getRowColor(status, index)}>
                        <td className="p-2 border">{req.serialNumber || "-"}</td>
                        <td className="p-2 border">{req.staffName}</td>
                        <td className="p-2 border">{req.staffDepartment}</td>
                        <td className="p-2 border">{req.requestType}</td>
                        <td className="p-2 border">{getStatusDisplay(status)}</td>
                        <td className="p-2 border">{formatDate(req.createdAt)}</td>
                        <td className="p-2 border">{formatDate(req.updatedAt)}</td>
                        <td className="p-2 border">
                          {req.attachments && req.attachments.length > 0 ? (
                            req.attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <span>{file.originalName}</span>
                                <button
                                  onClick={() => handleViewFile(file.url)}
                                  className="text-blue-600 underline text-xs"
                                >
                                  View
                                </button>
                              </div>
                            ))
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-2 border space-x-1">
                          <button
                            onClick={() => handleDownloadPDF(req._id)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(req._id)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
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
          </>
        )}

        {activeTab === "analytics" && <AnalyticsDashboard requests={staffRequests} />}

        {/* ================= EDIT USER MODAL ================= */}
{isEditOpen && selectedUser && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">

      <h2 className="text-lg font-semibold mb-4">
        Edit Pengguna
      </h2>

      <div className="space-y-3">

        <input
          className="w-full border p-2 rounded"
          value={selectedUser.name}
          onChange={(e) =>
            setSelectedUser({
              ...selectedUser,
              name: e.target.value,
            })
          }
        />

        <input
          className="w-full border p-2 rounded"
          value={selectedUser.email}
          onChange={(e) =>
            setSelectedUser({
              ...selectedUser,
              email: e.target.value,
            })
          }
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Department"
          value={selectedUser.department || ""}
          onChange={(e) =>
            setSelectedUser({
              ...selectedUser,
              department: e.target.value,
            })
          }
        />

        <select
          className="w-full border p-2 rounded"
          value={selectedUser.role}
          onChange={(e) =>
            setSelectedUser({
              ...selectedUser,
              role: e.target.value,
            })
          }
        >
          <option value="staff">Staff</option>
          <option value="approver">Approver</option>
          <option value="admin">Admin</option>
          <option value="technician">Technician</option>
        </select>

        {selectedUser.role === "approver" && (
          <select
            className="w-full border p-2 rounded"
            value={selectedUser.level || ""}
            onChange={(e) =>
              setSelectedUser({
                ...selectedUser,
                level: e.target.value,
              })
            }
          >
            <option value="">Pilih Level</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
          </select>
        )}

      </div>

      {/* BUTTONS */}
      <div className="flex justify-end mt-5 space-x-2">

        <button
          onClick={() => setIsEditOpen(false)}
          className="px-4 py-2 rounded bg-gray-200"
        >
          Cancel
        </button>

        <button
          onClick={handleUpdateUser}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Save
        </button>

      </div>

    </div>
  </div>
)}
        
      </div>
    </div>
  );
};

export default AdminDashboard;
