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
  const intervalRef = useRef(null);

  const token = localStorage.getItem("token");

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

  const getTempohCuti = (request) => {
    let detailsObj = {};
    if (request.details) {
      try {
        detailsObj =
          typeof request.details === "string"
            ? JSON.parse(request.details)
            : request.details;
      } catch {
        detailsObj = {};
      }
    }

    if (request.items && request.items.length > 0) {
      const item = request.items[0];
      const start = item.startDate || item.leaveDate;
      const end = item.endDate || item.leaveDate;
      if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
    }

    const start = detailsObj.startDate || detailsObj.leaveDate;
    const end = detailsObj.endDate || detailsObj.leaveDate;
    if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;

    const rootStart = request.startDate || request.leaveDate;
    const rootEnd = request.endDate || request.leaveDate;
    if (rootStart && rootEnd)
      return `${formatDate(rootStart)} - ${formatDate(rootEnd)}`;

    return "-";
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Gagal fetch request staff!");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    intervalRef.current = setInterval(fetchRequests, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const canApproveLevel = (request, approverId) => {
    const approvals = request.approvals || [];
    const levelObj = approvals.find((a) => a.approverId === approverId);
    if (!levelObj) return false;

    for (let i = 0; i < levelObj.level - 1; i++) {
      if (approvals[i]?.status !== "Approved") return false;
    }

    return levelObj.status === "Pending";
  };

  const handleApprove = async (levelObj) => {
    if (!signatureApprover)
      return Swal.fire("Error", "Sila tanda sebelum approve!", "error");

    try {
      await axios.put(
        `http://localhost:5000/api/requests/approve-level/${selectedRequest._id}`,
        { signatureApprover },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: "success",
        title: `Level ${levelObj.level} approved!`,
        timer: 1500,
        showConfirmButton: false,
      });

      setShowApproveModal(false);
      setSignatureApprover("");
      fetchRequests();
    } catch {
      Swal.fire("Error", "Gagal approve request", "error");
    }
  };

  const handleReject = async (levelObj) => {
    if (!signatureApprover)
      return Swal.fire("Error", "Sila tanda sebelum reject!", "error");

    try {
      await axios.put(
        `http://localhost:5000/api/requests/reject-level/${selectedRequest._id}`,
        { signatureApprover },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: "success",
        title: `Level ${levelObj.level} rejected!`,
        timer: 1500,
        showConfirmButton: false,
      });

      setShowApproveModal(false);
      setSignatureApprover("");
      fetchRequests();
    } catch {
      Swal.fire("Error", "Gagal reject request", "error");
    }
  };

  const renderApproverStatus = (request) => {
    const approvals = request.approvals || [];
    if (!approvals.length) return "-";

    return (
      <ul className="space-y-1">
        {approvals.map((a, idx) => (
          <li key={idx}>
            Level {a.level}: {a.approverName || a.approverId} -{" "}
            <span
              className={`font-semibold ${
                a.status === "Approved"
                  ? "text-green-600"
                  : a.status === "Rejected"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {a.status}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">
        Approver Dashboard
      </h1>

      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-blue-100 text-blue-800">
            <tr>
              {[
                "Staff",
                "Request Type",
                "Tempoh Cuti",
                "Submit Date",
                "Approvers",
                "Attachment",
                "Action",
              ].map((h, i) => (
                <th key={i} className="px-4 py-2 border border-gray-300">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white">
            {requests.map((r) => (
              <tr key={r._id}>
                <td className="px-4 py-2 border border-gray-300">
                  {r.staffName}
                </td>

                <td className="px-4 py-2 border border-gray-300">
                  {r.requestType}
                </td>

                <td className="px-4 py-2 border border-gray-300">
                  {r.requestType === "CUTI" ? getTempohCuti(r) : "-"}
                </td>

                <td className="px-4 py-2 border border-gray-300">
                  {formatDateTime(r.createdAt)}
                </td>

                <td className="px-4 py-2 border border-gray-300">
                  {renderApproverStatus(r)}
                </td>

                <td className="px-4 py-2 border border-gray-300">
                  {r.attachments && r.attachments.length > 0 ? (
                    <ul className="space-y-1">
                      {r.attachments.map((file, idx) => {
                        const filePath = file.filePath || file.path;
                        const fileName =
                          file.originalName ||
                          file.fileName ||
                          "Attachment";
                        if (!filePath) return null;

                        return (
                          <li key={idx}>
                            <a
                              href={`http://localhost:5000/${filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              📎 {fileName}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <span className="text-gray-400">Tiada fail</span>
                  )}
                </td>

                <td className="px-4 py-2 border border-gray-300">
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded"
                    onClick={() => {
                      setSelectedRequest(r);
                      setShowApproveModal(true);
                    }}
                  >
                    ✔ Approve / Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[520px]">
            <h2 className="text-xl font-bold mb-4">Approve / Reject</h2>

            <p>Staff: {selectedRequest.staffName}</p>
            <p>Request Type: {selectedRequest.requestType}</p>

            {selectedRequest.requestType === "CUTI" && (
              <p>Tempoh Cuti: {getTempohCuti(selectedRequest)}</p>
            )}

            {selectedRequest.attachments?.length > 0 && (
              <div className="mt-3">
                <p className="font-semibold">Attachment:</p>
                <ul className="space-y-1">
                  {selectedRequest.attachments.map((file, idx) => {
                    const filePath = file.filePath || file.path;
                    const fileName =
                      file.originalName || file.fileName || "Attachment";
                    if (!filePath) return null;

                    return (
                      <li key={idx}>
                        <a
                          href={`http://localhost:5000/${filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          📎 {fileName}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <ApproverSignaturePad
              onChange={(sig) => setSignatureApprover(sig)}
            />

            <div className="mt-4 space-y-2">
              {(selectedRequest.approvals || []).map((levelObj) =>
                canApproveLevel(selectedRequest, levelObj.approverId) ? (
                  <div
                    key={levelObj.level}
                    className="flex justify-between items-center"
                  >
                    <span>
                      Level {levelObj.level}:{" "}
                      {levelObj.approverName || levelObj.approverId}
                    </span>

                    <div className="space-x-2">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() => handleApprove(levelObj)}
                      >
                        ✔ Approve
                      </button>

                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded"
                        onClick={() => handleReject(levelObj)}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ) : null
              )}
            </div>

            <button
              onClick={() => {
                setShowApproveModal(false);
                setSignatureApprover("");
              }}
              className="mt-4 bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproverDashboard;
