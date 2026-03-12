import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import ApproverSignaturePad from "../pages/ApproverSignaturePad";

const ApproverDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signatureApprover, setSignatureApprover] = useState("");
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const intervalRef = useRef(null);

  const token = localStorage.getItem("token");

  // ================= DATE HELPERS =================
  const formatDateTime = (date) =>
    date
      ? new Date(date).toLocaleString("ms-MY", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("ms-MY", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

  // ================= TEMPoh CUTI =================
  const getTempohCuti = (request) => {
    if (request.leaveStart && request.leaveEnd) {
      return `${formatDate(request.leaveStart)} - ${formatDate(request.leaveEnd)}`;
    }
    return "-";
  };

  // ================= PROBLEM DESCRIPTION =================
  const getProblemDescription = (request) => {
    if (request.problemDescription && request.problemDescription.trim() !== "") {
      return request.problemDescription;
    }
    return "-";
  };

  // ================= STATUS BADGE =================
  const getStatusBadge = (status) => {
    if (status === "Approved")
      return "bg-green-600 text-white px-2 py-1 rounded text-xs";

    if (status === "Rejected")
      return "bg-red-600 text-white px-2 py-1 rounded text-xs";

    return "bg-yellow-500 text-white px-2 py-1 rounded text-xs";
  };

  // ================= ROW COLOR =================
  const getRowColor = (request) => {
    if (request.finalStatus === "Approved") return "bg-green-50";
    if (request.finalStatus === "Rejected") return "bg-red-50";
    if (request.requestType?.toLowerCase() === "maintenance" && !request.assignedTechnician)
      return "bg-yellow-50";
    return "bg-white";
  };

  // ================= FETCH =================
  const fetchRequests = async () => {
    try {
      const res = await axios.get(
        "https://backenduwleapprovalsystem.onrender.com/api/requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Gagal fetch request staff!");
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get(
        "https://backenduwleapprovalsystem.onrender.com/api/users/technicians",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTechnicians(res.data || []);
    } catch (err) {
      console.error("Gagal fetch technicians", err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchTechnicians();
    intervalRef.current = setInterval(fetchRequests, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // ================= APPROVE =================
  const handleApprove = async () => {
    if (!signatureApprover)
      return Swal.fire("Error", "Sila tanda sebelum approve!", "error");

    if (selectedRequest.finalStatus !== "Pending")
      return Swal.fire("Info", "Request telah dikunci!", "info");

    try {
      await axios.put(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/approve-level/${selectedRequest._id}`,
        { signatureApprover },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({ icon: "success", title: "Request Approved", timer: 1500, showConfirmButton: false });
      setShowApproveModal(false);
      setSignatureApprover("");
      fetchRequests();
    } catch {
      Swal.fire("Error", "Gagal approve request", "error");
    }
  };

  // ================= REJECT =================
  const handleReject = async () => {
    if (!signatureApprover)
      return Swal.fire("Error", "Sila tanda sebelum reject!", "error");

    if (selectedRequest.finalStatus !== "Pending")
      return Swal.fire("Info", "Request telah dikunci!", "info");

    try {
      await axios.put(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/reject-level/${selectedRequest._id}`,
        { signatureApprover },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({ icon: "success", title: "Request Rejected", timer: 1500, showConfirmButton: false });
      setShowApproveModal(false);
      setSignatureApprover("");
      fetchRequests();
    } catch {
      Swal.fire("Error", "Gagal reject request", "error");
    }
  };

  // ================= ASSIGN TECHNICIAN =================
  const handleAssignTechnician = async (requestId, techId) => {
    try {
      await axios.put(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/${requestId}/assign-technician`,
        { technicianId: techId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state supaya dropdown nama terus muncul
      setSelectedRequest((prev) => ({
        ...prev,
        assignedTechnician: techId
      }));
      Swal.fire({ icon: "success", title: "Technician Assigned", timer: 1200, showConfirmButton: false });
      fetchRequests();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal assign technician", "error");
    }
  };

  // ================= RENDER =================
  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Approver Dashboard</h1>

      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-blue-100 text-blue-800">
            <tr>
              <th className="border px-3 py-2">Staff</th>
              <th className="border px-3 py-2">Request Type</th>
              <th className="border px-3 py-2">Tempoh Cuti</th>
              <th className="border px-3 py-2">Submit Date</th>
              <th className="border px-3 py-2">Problem Description</th>
              <th className="border px-3 py-2">Status</th>
              <th className="border px-3 py-2">Attachment</th>
              <th className="border px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r._id} className={getRowColor(r)}>
                <td className="border px-3 py-2">{r.staffName}</td>
                <td className="border px-3 py-2">{r.requestType}</td>
                <td className="border px-3 py-2">{r.requestType?.toLowerCase() === "cuti" ? getTempohCuti(r) : "-"}</td>
                <td className="border px-3 py-2">{formatDateTime(r.createdAt)}</td>
                <td className="border px-3 py-2">{getProblemDescription(r)}</td>
                <td className="border px-3 py-2">
                  <span className={getStatusBadge(r.finalStatus)}>{r.finalStatus || "Pending"}</span>
                </td>
                <td className="border px-3 py-2">
                  {r.attachments?.length > 0 ? (
                    r.attachments.map((file, i) => (
                      <div key={i}>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View File</a>
                      </div>
                    ))
                  ) : "No File"}
                </td>
                <td className="border px-3 py-2">
                  {r.finalStatus === "Pending" ? (
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      onClick={() => {
                        setSelectedRequest(r);
                        setShowApproveModal(true);
                      }}
                    >
                      Approve / Reject
                    </button>
                  ) : (
                    <span className="text-gray-500 italic font-semibold">{r.finalStatus}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-[500px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Approve / Reject Request</h2>
            <p><b>Staff:</b> {selectedRequest.staffName}</p>
            <p><b>Problem:</b> {getProblemDescription(selectedRequest)}</p>

            {selectedRequest.requestType?.toLowerCase() === "maintenance" && (
              <div className="mt-3">
                <label className="font-semibold">Assign Technician</label>
                <select
                  className="border w-full mt-1 p-2"
                  value={selectedRequest.assignedTechnician || ""}
                  onChange={(e) => handleAssignTechnician(selectedRequest._id, e.target.value)}
                >
                  <option value="">Select Technician</option>
                  {technicians.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <ApproverSignaturePad onChange={(sig) => setSignatureApprover(sig)} />

            <div className="flex justify-end gap-3 mt-4">
              <button
                className={`px-4 py-2 rounded text-white ${selectedRequest.finalStatus !== "Pending" ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                onClick={handleApprove}
                disabled={selectedRequest.finalStatus !== "Pending"}
              >
                Approve
              </button>

              <button
                className={`px-4 py-2 rounded text-white ${selectedRequest.finalStatus !== "Pending" ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                onClick={handleReject}
                disabled={selectedRequest.finalStatus !== "Pending"}
              >
                Reject
              </button>

              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowApproveModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproverDashboard;
