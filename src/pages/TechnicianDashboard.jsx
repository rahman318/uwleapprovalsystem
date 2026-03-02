// TechnicianDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const TechnicianDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [remarks, setRemarks] = useState({}); // untuk simpan remark sementara tiap row

  const token = localStorage.getItem("token");

  // ================== DIGITAL CLOCK ==================
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (date) => date.toLocaleTimeString();

  // ================== FETCH CURRENT USER ==================
  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(
        "https://backenduwleapprovalsystem.onrender.com/api/users/me",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentUser(res.data);
    } catch (err) {
      console.error("❌ Fetch current user error:", err);
    }
  };

  // ================== FETCH REQUESTS ==================
  const fetchRequests = async () => {
    if (!currentUser) return;
    try {
      const res = await axios.get(
        "https://backenduwleapprovalsystem.onrender.com/api/requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const myRequests = res.data.filter(
        (r) =>
          r.assignedTechnician &&
          r.assignedTechnician.toString() === currentUser._id.toString() &&
          r.requestType === "Maintenance"
      );

      setRequests(myRequests);

      // initialize remarks state
      const initialRemarks = {};
      myRequests.forEach((r) => {
        initialRemarks[r._id] = r.remark || "";
      });
      setRemarks(initialRemarks);
    } catch (err) {
      console.error("❌ Fetch requests error:", err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000); // refresh 10s
    return () => clearInterval(interval);
  }, [currentUser]);

  // ================== FORMAT TIME TAKEN ==================
  const formatTimeTaken = (minutes) => {
    if (minutes == null) return "-";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs} jam ${mins} minit` : `${mins} minit`;
  };

  // ================== SLA COUNTDOWN ==================
  const getSLARemaining = (assignedAt, slaHours, maintenanceStatus) => {
    if (!assignedAt || maintenanceStatus === "Completed") return "-";

    const assignedTime = new Date(assignedAt);
    const deadline = new Date(assignedTime.getTime() + slaHours * 60 * 60 * 1000);
    const diffMs = deadline - currentTime;
    const diffAbs = Math.abs(diffMs);

    const hours = Math.floor(diffAbs / (1000 * 60 * 60));
    const minutes = Math.floor((diffAbs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) return <span className="text-red-600 font-bold animate-pulse">🚨 {hours}h {minutes}m overdue</span>;
    if (hours === 0 && minutes <= 30) return <span className="text-yellow-600 font-semibold">⏳ {hours}h {minutes}m left</span>;

    return `⏳ ${hours}h ${minutes}m left`;
  };

  // ================== STATUS BADGE ==================
  const getStatusBadge = (request) => {
    if (request.maintenanceStatus === "Submitted") {
      return <span className="px-3 py-1 rounded-full text-white bg-gray-500 font-semibold">Submitted</span>;
    }
    if (request.maintenanceStatus === "In Progress") {
      return <span className="px-3 py-1 rounded-full text-white bg-yellow-500 animate-pulse font-bold">🚧 In Progress</span>;
    }
    if (request.maintenanceStatus === "Completed") {
      return <span className="px-3 py-1 rounded-full text-white bg-green-600 font-bold">✅ Completed</span>;
    }
    return request.maintenanceStatus;
  };

  // ================== UPDATE STATUS ==================
  const handleMarkStatus = async (requestId) => {
    try {
      const request = requests.find((r) => r._id === requestId);
      if (!request) return;

      let confirmTitle = "";
      if (request.maintenanceStatus === "Submitted") confirmTitle = "Mark as In Progress?";
      else if (request.maintenanceStatus === "In Progress") confirmTitle = "Mark as Completed?";
      else return;

      const confirm = await Swal.fire({
        icon: "question",
        title: confirmTitle,
        showCancelButton: true,
      });

      if (!confirm.isConfirmed) return;

      const res = await axios.put(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/${requestId}/maintenance`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({ icon: "success", title: "Status updated", timer: 1500, showConfirmButton: false });

      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? { ...r, ...res.data.request } : r))
      );
    } catch (err) {
      console.error("❌ Update status error:", err);
      Swal.fire({ icon: "error", title: "Gagal kemaskini status" });
    }
  };

  // ================== SAVE REMARK ==================
  const handleSaveRemark = async (requestId) => {
    try {
      const remark = remarks[requestId] || "";
      const res = await axios.patch(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/${requestId}/remark`,
        { remark },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({ icon: "success", title: "Remark berjaya disimpan", timer: 1500, showConfirmButton: false });

      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? { ...r, remark: res.data.request.remark } : r))
      );
    } catch (err) {
      console.error("❌ Save remark error:", err);
      Swal.fire({ icon: "error", title: "Gagal simpan remark" });
    }
  };

  // ================== UI ==================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Technician Dashboard</h1>
          <div className="bg-black text-green-400 font-mono px-4 py-2 rounded-lg shadow-lg text-lg">
            {formatClock(currentTime)}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="w-full text-sm table-auto border-collapse">
            <thead className="bg-blue-100">
              <tr>
                <th className="p-3 border text-left">Serial</th>
                <th className="p-3 border text-left">Staff</th>
                <th className="p-3 border text-left">Dept</th>
                <th className="p-3 border text-left">Status</th>
                <th className="p-3 border text-left">SLA</th>
                <th className="p-3 border text-left">Time Taken</th>
                <th className="p-3 border text-left">Attachments</th>
                <th className="p-3 border text-left">Remark</th> {/* new column */}
                <th className="p-3 border text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-4 border text-gray-500">Tiada request untuk anda</td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="p-3 border font-semibold text-blue-700">{r.serialNumber}</td>
                    <td className="p-3 border">{r.staffName}</td>
                    <td className="p-3 border">{r.staffDepartment}</td>
                    <td className="p-3 border">{getStatusBadge(r)}</td>
                    <td className="p-3 border">{getSLARemaining(r.assignedAt, r.slaHours, r.maintenanceStatus)}</td>
                    <td className="p-3 border">{r.maintenanceStatus === "Completed" ? formatTimeTaken(r.timeToComplete) : "-"}</td>
                    <td className="p-3 border">
                      {r.attachments?.length > 0 ? (
                        <ul className="space-y-1">
                          {r.attachments.map((file, idx) => {
                            const fileName = file.originalName || file.fileName || "Attachment";
                            const fileUrl = file.url || (file.filePath ? `https://backenduwleapprovalsystem.onrender.com/${file.filePath}` : null);
                            if (!fileUrl) return null;
                            return (
                              <li key={idx} className="flex items-center gap-2">
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">📎 {fileName}</a>
                                <button onClick={() => window.open(fileUrl, "_blank")} className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">View</button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : <span className="text-gray-400">Tiada fail</span>}
                    </td>
                    <td className="p-3 border">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={remarks[r._id] || ""}
                          onChange={(e) => setRemarks(prev => ({ ...prev, [r._id]: e.target.value }))}
                          className="border border-gray-300 p-1 rounded w-full text-sm"
                          placeholder="Masukkan remark..."
                        />
                        <button
                          onClick={() => handleSaveRemark(r._id)}
                          className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-sm"
                        >
                          Simpan
                        </button>
                      </div>
                    </td>
                    <td className="p-3 border">
                      {r.maintenanceStatus !== "Completed" ? (
                        <button onClick={() => handleMarkStatus(r._id)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Update</button>
                      ) : (
                        <span className="text-green-700 font-semibold">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
