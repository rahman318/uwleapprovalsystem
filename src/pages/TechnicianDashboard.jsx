// TechnicianDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const TechnicianDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const token = localStorage.getItem("token");

  // ================== DIGITAL CLOCK ==================
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (date) => date.toLocaleTimeString();

  // ================== FETCH CURRENT USER ==================
  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error("❌ Fetch current user error:", err);
    }
  };

  // ================== FETCH REQUESTS ==================
  const fetchRequests = async () => {
    if (!currentUser) return;
    try {
      const res = await axios.get("http://localhost:5000/api/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const myRequests = res.data.filter(
        (r) =>
          r.assignedTechnician &&
          r.assignedTechnician.toString() === currentUser._id.toString() &&
          r.requestType === "Maintenance"
      );

      setRequests(myRequests);
    } catch (err) {
      console.error("❌ Fetch requests error:", err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // ================== FORMAT TIME ==================
  const formatTimeTaken = (minutes) => {
    if (minutes == null) return "-";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs} jam ${mins} minit`;
    return `${mins} minit`;
  };

  // ================== OVERDUE CHECK ==================
  const checkOverdue = (assignedAt, slaHours, maintenanceStatus) => {
    if (!assignedAt) return false;
    if (maintenanceStatus === "Completed") return false;

    const assignedTime = new Date(assignedAt);
    const diffHours = (currentTime - assignedTime) / (1000 * 60 * 60);

    return diffHours > slaHours;
  };

  // ================== SLA COUNTDOWN ==================
  const getSLARemaining = (assignedAt, slaHours, maintenanceStatus) => {
    if (!assignedAt || maintenanceStatus === "Completed") return "-";

    const assignedTime = new Date(assignedAt);
    const deadline = new Date(
      assignedTime.getTime() + slaHours * 60 * 60 * 1000
    );

    const diffMs = deadline - currentTime;
    const absMs = Math.abs(diffMs);

    const hours = Math.floor(absMs / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) {
      return `🚨 ${hours}h ${minutes}m overdue`;
    }

    return `⏳ ${hours}h ${minutes}m left`;
  };

  // ================== STATUS BADGE ==================
  const getStatusBadge = (request) => {
    const isOverdue = checkOverdue(
      request.assignedAt,
      request.slaHours,
      request.maintenanceStatus
    );

    if (isOverdue) {
      return (
        <span className="px-3 py-1 rounded-full text-white bg-red-600 animate-pulse font-bold">
          🚨 OVERDUE
        </span>
      );
    }

    switch (request.maintenanceStatus) {
      case "Submitted":
        return (
          <span className="px-3 py-1 rounded-full text-white bg-gray-500">
            Submitted
          </span>
        );
      case "In Progress":
        return (
          <span className="px-3 py-1 rounded-full text-white bg-yellow-500 animate-pulse">
            🚧 In Progress
          </span>
        );
      case "Completed":
        return (
          <span className="px-3 py-1 rounded-full text-white bg-green-600">
            ✅ Completed
          </span>
        );
      default:
        return request.maintenanceStatus;
    }
  };

  // ================== UPDATE STATUS ==================
  const handleMarkStatus = async (requestId) => {
    try {
      const request = requests.find((r) => r._id === requestId);
      if (!request) return;

      let confirmTitle = "";
      if (request.maintenanceStatus === "Submitted")
        confirmTitle = "Mark as In Progress?";
      else if (request.maintenanceStatus === "In Progress")
        confirmTitle = "Mark as Completed?";
      else return;

      const confirm = await Swal.fire({
        icon: "question",
        title: confirmTitle,
        showCancelButton: true,
      });

      if (!confirm.isConfirmed) return;

      const res = await axios.put(
        `http://localhost:5000/api/requests/${requestId}/maintenance`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: "success",
        title: "Status updated",
        timer: 1500,
        showConfirmButton: false,
      });

      setRequests((prev) =>
        prev.map((r) =>
          r._id === requestId ? { ...r, ...res.data.request } : r
        )
      );
    } catch (err) {
      console.error("❌ Update status error:", err);
      Swal.fire({ icon: "error", title: "Gagal kemaskini status" });
    }
  };

  // ================== UI ==================
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">
            Technician Dashboard
          </h1>

          <div className="bg-black text-green-400 font-mono px-4 py-2 rounded-lg shadow-lg text-lg">
            {formatClock(currentTime)}
          </div>
        </div>

        <table className="w-full text-sm border border-gray-300 border-collapse">
          <thead>
            <tr className="bg-blue-100">
              <th className="p-3 border">Serial</th>
              <th className="p-3 border">Staff</th>
              <th className="p-3 border">Department</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">SLA</th>
              <th className="p-3 border">Time Taken</th>
              <th className="p-3 border">Attachments</th>
              <th className="p-3 border">Action</th>
            </tr>
          </thead>

          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-4 border">
                  Tiada request untuk anda
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="p-3 border font-semibold text-blue-700">
                    {r.serialNumber}
                  </td>

                  <td className="p-3 border">{r.staffName}</td>
                  <td className="p-3 border">{r.staffDepartment}</td>

                  <td className="p-3 border">
                    {getStatusBadge(r)}
                  </td>

                  <td className="p-3 border">
                    {getSLARemaining(
                      r.assignedAt,
                      r.slaHours,
                      r.maintenanceStatus
                    )}
                  </td>

                  <td className="p-3 border">
                    {r.maintenanceStatus === "Completed"
                      ? formatTimeTaken(r.timeToComplete)
                      : "-"}
                  </td>

                  <td className="p-3 border">
                    {r.attachments?.length > 0 ? (
                      r.attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                          onClick={() => {
                            if (file.fileUrl) {
                              window.open(file.fileUrl, "_blank");
                            } else if (file.filePath) {
                              window.open(
                                `http://localhost:5000/${file.filePath}`,
                                "_blank"
                              );
                            }
                          }}
                        >
                          📎 {file.originalName}
                        </div>
                      ))
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="p-3 border">
                    {r.maintenanceStatus !== "Completed" ? (
                      <button
                        onClick={() => handleMarkStatus(r._id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Update
                      </button>
                    ) : (
                      <span className="text-green-700 font-semibold">
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TechnicianDashboard;