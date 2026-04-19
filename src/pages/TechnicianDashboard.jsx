// TechnicianDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const TechnicianDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [remarks, setRemarks] = useState({}); // { requestId: { text: "", file: File } }

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
    console.log("🚀 Fetching current user...");

    const res = await axios.get(
      "https://backenduwleapprovalsystem.onrender.com/api/users/me",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("👤 CURRENT USER:", res.data);

    setCurrentUser(res.data);
  } catch (err) {
    console.error("❌ Fetch current user error:", err);
  }
};

// ================== FETCH TECHNICIAN REQUESTS ==================
const fetchRequests = async () => {
  if (!currentUser?._id) {
    console.log("⏳ Skipped fetch - user not ready yet");
    return;
  }

  try {
    console.log("📡 Fetching technician requests...");

    const res = await axios.get(
      "https://backenduwleapprovalsystem.onrender.com/api/requests",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("📦 RAW RESPONSE:", res.data);

    // ================== FILTER (SAFE ONLY MAINTENANCE) ==================
    const myRequests = res.data.filter((r) => {
      const isMaintenance = r.requestType === "Maintenance";
      return isMaintenance;
    });

    console.log("🛠 FILTERED TECH REQUESTS:", myRequests);

    setRequests(myRequests);

    // ================== INIT REMARKS ==================
    const initialRemarks = {};

    myRequests.forEach((r) => {
      console.log("🔍 INIT REMARK:", r._id, r.requestType);

      initialRemarks[r._id] = {
        text: r.technicianRemark || "",
        file: null,
      };
    });

    setRemarks(initialRemarks);

    console.log("✅ REMARK STATE READY");
  } catch (err) {
    console.error("❌ Fetch requests error:", err);
  }
};

// ================== FETCH USER FIRST ==================
useEffect(() => {
  fetchCurrentUser();
}, []);

// ================== FETCH REQUESTS AFTER USER READY ==================
useEffect(() => {
  if (!currentUser?._id) {
    console.log("⏳ Waiting for currentUser...");
    return;
  }

  fetchRequests();

  const interval = setInterval(() => {
    console.log("🔄 Auto refresh requests...");
    fetchRequests();
  }, 10000);

  return () => {
    console.log("🧹 Clearing interval...");
    clearInterval(interval);
  };
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

    if (diffMs < 0)
      return <span className="text-red-600 font-bold animate-pulse">🚨 {hours}h {minutes}m overdue</span>;
    if (hours === 0 && minutes <= 30)
      return <span className="text-yellow-600 font-semibold">⏳ {hours}h {minutes}m left</span>;
    return `⏳ ${hours}h ${minutes}m left`;
  };

  // ================== STATUS BADGE ==================
  const getStatusBadge = (request) => {
    if (request.maintenanceStatus === "Submitted")
      return <span className="px-3 py-1 rounded-full text-white bg-gray-500 font-semibold">Submitted</span>;
    if (request.maintenanceStatus === "In Progress")
      return <span className="px-3 py-1 rounded-full text-white bg-yellow-500 animate-pulse font-bold">🚧 In Progress</span>;
    if (request.maintenanceStatus === "Completed")
      return <span className="px-3 py-1 rounded-full text-white bg-green-600 font-bold">✅ Completed</span>;
    return request.maintenanceStatus;
  };

  // ================== UPDATE STATUS ==================
const handleMarkStatus = async (requestId) => {
  try {
    console.log("🚀 [STATUS FLOW] Clicked requestId:", requestId);

    const request = requests.find((r) => r._id === requestId);

    if (!request) {
      console.log("❌ [STATUS FLOW] Request not found in state");
      return;
    }

    console.log("📦 [STATUS FLOW] Current Request:", request);

    // 🔥 SAFE STATUS (support old + new field)
    const currentStatus = request.maintenanceStatus || request.status;

    console.log("🔍 [STATUS FLOW] Current Status:", currentStatus);

    let newStatus = "";
    let confirmTitle = "";

    if (currentStatus === "Submitted") {
      newStatus = "In Progress";
      confirmTitle = "Mark as In Progress?";
    } else if (currentStatus === "In Progress") {
      newStatus = "Completed";
      confirmTitle = "Mark as Completed?";
    } else {
      console.log("⚠️ [STATUS FLOW] Status not allowed to change");
      return;
    }

    console.log("➡️ [STATUS FLOW] New Status to update:", newStatus);

    // ================= CONFIRMATION =================
    const confirm = await Swal.fire({
      icon: "question",
      title: confirmTitle,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (!confirm.isConfirmed) {
      console.log("❌ [STATUS FLOW] User cancelled update");
      return;
    }

    console.log("📡 [STATUS FLOW] Sending API request...");

    // ================= API CALL =================
    const res = await axios.put(
      `https://backenduwleapprovalsystem.onrender.com/api/requests/${requestId}/maintenance`,
      { maintenanceStatus: newStatus }, // 🔥 FIXED FIELD
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✅ [STATUS FLOW] API Response:", res.data);

    Swal.fire({
      icon: "success",
      title: "Status updated",
      timer: 1500,
      showConfirmButton: false,
    });

    // ================= UPDATE STATE =================
    setRequests((prev) =>
      prev.map((r) =>
        r._id === requestId ? { ...r, ...res.data.request } : r
      )
    );

    console.log("🔄 [STATUS FLOW] State updated successfully");
  } catch (err) {
    console.error("❌ [STATUS FLOW] Update status error:", err);
    console.error("❌ [STATUS FLOW] Backend response:", err?.response?.data);

    Swal.fire({
      icon: "error",
      title: "Gagal kemaskini status",
    });
  }
};

  // ================== SAVE REMARK + PROOF ==================
  const handleSaveRemark = async (requestId) => {
    try {
      const remarkObj = remarks[requestId] || {};
      const formData = new FormData();
      formData.append("technicianRemark", remarkObj.text || "");
      if (remarkObj.file) formData.append("proofImage", remarkObj.file);

      const res = await axios.patch(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/${requestId}/technician-update`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire({ icon: "success", title: "Remark & proof berjaya disimpan", timer: 1500, showConfirmButton: false });

      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? { ...r, ...res.data.request } : r))
      );

      setRemarks((prev) => ({ ...prev, [requestId]: { text: remarkObj.text } })); // clear file
    } catch (err) {
      console.error("❌ Save remark & proof error:", err);
      Swal.fire({ icon: "error", title: "Gagal simpan remark / proof" });
    }
  };

  // ================== UI ==================
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 md:gap-0">
          <h1 className="text-3xl font-bold text-blue-700">Technician Dashboard</h1>
          <div className="bg-black text-green-400 font-mono px-4 py-2 rounded-lg shadow-lg text-lg">
            {formatClock(currentTime)}
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="w-full text-sm table-auto border-collapse">
            <thead className="bg-blue-100">
              <tr>
                <th className="p-3 border text-left">Serial</th>
                <th className="p-3 border text-left">Requestor</th>
                <th className="p-3 border text-left">Dept</th>
                <th className="p-3 border text-left">Problem</th>
                <th className="p-3 border text-left">Status</th>
                <th className="p-3 border text-left">SLA</th>
                <th className="p-3 border text-left">Time Taken</th>
                <th className="p-3 border text-left">Attachments</th>
                <th className="p-3 border text-left">Remark / Proof</th>
                <th className="p-3 border text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center p-4 border text-gray-500">Tiada request untuk anda</td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="p-3 border font-semibold text-blue-700">{r.serialNumber}</td>
                    <td className="p-3 border">{r.staffName}</td>
                    <td className="p-3 border">{r.staffDepartment}</td>
                    <td className="p-3 border text-gray-700 max-w-xs whitespace-pre-wrap text-sm">{r.problemDescription || <span className="text-gray-400 italic">Tiada deskripsi</span>}</td>
                    <td className="p-3 border">{getStatusBadge(r)}</td>
                    <td className="p-3 border">{getSLARemaining(r.assignedAt, r.slaHours, r.maintenanceStatus)}</td>
                    <td className="p-3 border">{r.maintenanceStatus === "Completed" ? formatTimeTaken(r.timeToComplete) : "-"}</td>

                    {/* ATTACHMENTS */}
                    <td className="p-3 border">
                      {r.attachments?.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {r.attachments.map((file, idx) => {
                            const fileName = file.originalName || file.fileName || "Attachment";
                            const fileUrl = file.url || (file.filePath ? `https://backenduwleapprovalsystem.onrender.com/${file.filePath}` : null);
                            if (!fileUrl) return null;
                            return (
                              <a
                                key={idx}
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-blue-600 text-sm"
                              >
                                📎 {fileName}
                                <span className="ml-2 text-green-600 font-semibold">View</span>
                              </a>
                            );
                          })}
                        </div>
                      ) : <span className="text-gray-400 italic">Tiada fail</span>}
                    </td>

                    {/* REMARK + PROOF */}
                    <td className="p-3 border">
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={remarks[r._id]?.text || ""}
                          onChange={(e) => setRemarks(prev => ({ ...prev, [r._id]: { ...prev[r._id], text: e.target.value } }))}
                          placeholder="Masukkan remark..."
                          className="border border-gray-300 p-2 rounded w-full text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setRemarks(prev => ({ ...prev, [r._id]: { ...prev[r._id], file } }));
                            }
                          }}
                          className="border border-gray-300 p-2 rounded text-sm"
                        />

                        {remarks[r._id]?.file && (
                          <img
                            src={URL.createObjectURL(remarks[r._id].file)}
                            alt="Preview"
                            className="w-24 h-24 object-cover border border-gray-200 rounded shadow-sm"
                          />
                        )}

                        <button
                          onClick={() => handleSaveRemark(r._id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                        >
                          Simpan
                        </button>
                      </div>
                    </td>

                    {/* ACTION */}
                    <td className="p-3 border">
                      {r.maintenanceStatus !== "Completed" ? (
                        <button
                          onClick={() => handleMarkStatus(r._id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                          Update
                        </button>
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
