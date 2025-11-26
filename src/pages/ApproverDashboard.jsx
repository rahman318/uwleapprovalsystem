import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import ApproverSignaturePad from "../pages/ApproverSignaturePad"; // path betul

const ApproverDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signatureApprover, setSignatureApprover] = useState("");
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const intervalRef = useRef(null);

  const token = localStorage.getItem("token");

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("ms-MY") : "-";

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

  const fetchRequests = async () => {
    try {
      const res = await axios.get("https://backenduwleapprovalsystem.onrender.com/api/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.filter((r) => r.status === "Pending"));
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching requests:", err);
      setError("Gagal fetch request staff!");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    intervalRef.current = setInterval(fetchRequests, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleAction = async (id, action) => {
    try {
      await axios.patch(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/${id}`,
        { status: action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({
        icon: "success",
        title: `Request ${action}d`,
        timer: 1500,
        showConfirmButton: false,
      });
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Gagal update request" });
    }
  };

  const handleViewPDF = async (id) => {
    try {
      const res = await axios.get(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/${id}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const fileURL = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );

      window.open(fileURL, "_blank");
    } catch (err) {
      console.error("❌ PDF error:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal buka PDF bossskurrr!",
        text: "Check backend / file not found",
      });
    }
  };

  const renderFile = (file) => {
    if (!file) return "-";
    const ext = file.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
      return (
        <a href={file} target="_blank" rel="noopener noreferrer">
          <img
            src={file}
            alt="upload"
            className="w-16 h-16 object-cover rounded"
          />
        </a>
      );
    } else {
      return (
        <a
          href={file}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Download File
        </a>
      );
    }
  };

  const renderStatus = (status) => {
    let color = "";
    if (status === "Pending") color = "bg-yellow-100 text-yellow-800";
    if (status === "Approved") color = "bg-green-100 text-green-800";
    if (status === "Rejected") color = "bg-red-100 text-red-800";

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">
        Approver Dashboard
      </h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-100 text-blue-800">
            <tr>
              <th className="px-4 py-2 text-left">Staff</th>
              <th className="px-4 py-2 text-left">Request Type</th>
              <th className="px-4 py-2 text-left">Submit Date</th>
              <th className="px-4 py-2 text-left">Leave Period</th>
              <th className="px-4 py-2 text-left">Details</th>
              <th className="px-4 py-2 text-left">File</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((r) => (
              <tr
                key={r._id}
                className="hover:bg-gray-50 transition duration-200"
              >
                <td className="px-4 py-2 font-medium">
                  {r.userId?.username || r.staffName || "-"}
                </td>
                <td className="px-4 py-2">{r.requestType}</td>
                <td className="px-4 py-2">{formatDateTime(r.createdAt)}</td>
                <td className="px-4 py-2">
                  {r.requestType === "Cuti" ? (
                    r.leaveStart && r.leaveEnd ? (
                      `${formatDate(r.leaveStart)} → ${formatDate(r.leaveEnd)}`
                    ) : r.leaveStart ? (
                      formatDate(r.leaveStart)
                    ) : r.leaveEnd ? (
                      formatDate(r.leaveEnd)
                    ) : (
                      "-"
                    )
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-2">{r.details || "-"}</td>
                <td className="px-4 py-2">{renderFile(r.file)}</td>
                <td className="px-4 py-2">{renderStatus(r.status)}</td>
                <td className="px-4 py-2 flex space-x-2">
                  <button
                    onClick={() => handleViewPDF(r._id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                  >
                    📄 View PDF
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRequest(r);
                      setShowApproveModal(true);
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                  >
                    ✔ Approve
                  </button>

                  <button
                    onClick={() => handleAction(r._id, "Rejected")}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                  >
                    ❌ Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ⬅️ Modal Approve */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[500px]">
            <h2 className="text-xl font-bold mb-4">Approve Request</h2>
            <p className="mb-2">Staff: {selectedRequest.staffName}</p>
            <p className="mb-2">Request Type: {selectedRequest.requestType}</p>

            <ApproverSignaturePad
              onSave={(sig) => setSignatureApprover(sig)}
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={async () => {
                  if (!signatureApprover)
                    return alert("Sila tanda sebelum approve!");

                  try {
                    await axios.put(
                      `http://localhost:5000/api/requests/approve/${selectedRequest._id}`,
                      {
                        status: "Approved",
                        signatureApprover,
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    Swal.fire({
                      icon: "success",
                      title: "Request approved & signature saved!",
                      timer: 1500,
                      showConfirmButton: false,
                    });
                    fetchRequests();
                    setShowApproveModal(false);
                    setSignatureApprover("");
                  } catch (err) {
                    console.error(err);
                    Swal.fire({
                      icon: "error",
                      title: "Gagal approve request",
                    });
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSignatureApprover("");
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
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
