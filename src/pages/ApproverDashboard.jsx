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
  const [selectedTechnicians, setSelectedTechnicians] = useState({});

  const intervalRef = useRef(null);
  const token = localStorage.getItem("token");

  // ================= DATE =================
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
    date ? new Date(date).toLocaleDateString("ms-MY") : "-";

  // ================= CUTI =================
  const getTempohCuti = (request) => {
    let d = {};
    try {
      d =
        typeof request.details === "string"
          ? JSON.parse(request.details)
          : request.details || {};
    } catch {}

    const start = d.startDate || request.startDate || request.leaveDate;
    const end = d.endDate || request.endDate || request.leaveDate;

    return start && end ? `${formatDate(start)} - ${formatDate(end)}` : "-";
  };

  // ================= STATUS =================
  const getStatusBadge = (status) => {
    if (status === "Approved")
      return "bg-green-600 text-white px-2 py-1 rounded text-xs";
    if (status === "Rejected")
      return "bg-red-600 text-white px-2 py-1 rounded text-xs";
    return "bg-yellow-500 text-white px-2 py-1 rounded text-xs";
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
    } catch {
      setError("Gagal fetch request!");
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
      console.error(err);
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
      return Swal.fire("Error", "Sila tanda dulu!", "error");

    await axios.put(
      `https://backenduwleapprovalsystem.onrender.com/api/requests/approve-level/${selectedRequest._id}`,
      { signatureApprover },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Swal.fire("Approved!", "", "success");
    setShowApproveModal(false);
    fetchRequests();
  };

  // ================= REJECT =================
  const handleReject = async () => {
    const { value: remark } = await Swal.fire({
      title: "Reject Reason",
      input: "textarea",
      showCancelButton: true,
    });

    if (!remark) return;

    await axios.put(
      `https://backenduwleapprovalsystem.onrender.com/api/requests/reject-level/${selectedRequest._id}`,
      { signatureApprover, remark },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Swal.fire("Rejected", "", "success");
    setShowApproveModal(false);
    fetchRequests();
  };

  // ================= MULTI ASSIGN =================
  const handleAssignTechnician = async (id) => {
    const techIds = selectedTechnicians[id] || [];

    if (techIds.length === 0)
      return Swal.fire("Error", "Pilih technician!", "error");

    await axios.put(
      `https://backenduwleapprovalsystem.onrender.com/api/requests/${id}/assign-technician`,
      { technicianIds: techIds },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Swal.fire("Assigned!", "", "success");
    fetchRequests();
  };

  // ================= RENDER =================
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">
        Approver Dashboard
      </h1>

      {/* TABLE */}
      <div className="overflow-x-auto shadow-lg rounded-xl">
        <table className="min-w-full border text-sm">
          <thead className="bg-blue-100 text-blue-800">
            <tr>
              <th className="border px-3 py-2">Staff</th>
              <th className="border px-3 py-2">Type</th>
              <th className="border px-3 py-2">Tempoh</th>
              <th className="border px-3 py-2">Date</th>
              <th className="border px-3 py-2">Problem</th>
              <th className="border px-3 py-2">Attachment</th> {/* 🔥 FIXED */}
              <th className="border px-3 py-2">Status</th>
              <th className="border px-3 py-2">Technician</th>
              <th className="border px-3 py-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((r, index) => (
              <tr
                key={r._id}
                className={`${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50 transition`}
              >
                <td className="border px-3 py-2">{r.staffName}</td>
                <td className="border px-3 py-2">{r.requestType}</td>

                <td className="border px-3 py-2">
                  {r.requestType === "cuti" ? getTempohCuti(r) : "-"}
                </td>

                <td className="border px-3 py-2">
                  {formatDateTime(r.createdAt)}
                </td>

                <td className="border px-3 py-2 max-w-[200px] truncate">
                  {r.problemDescription || "-"}
                </td>

                {/* 🔥 ATTACHMENT FIX */}
                <td className="border px-3 py-2">
                  {r.attachments?.length > 0 ? (
                    r.attachments.map((file, i) => (
                      <div key={i}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          View File
                        </a>
                      </div>
                    ))
                  ) : (
                    "-"
                  )}
                </td>

                <td className="border px-3 py-2">
                  <span className={getStatusBadge(r.finalStatus)}>
                    {r.finalStatus || "Pending"}
                  </span>
                </td>

                {/* 🔥 TECHNICIAN BADGE */}
                <td className="border px-3 py-2">
                  {r.assignedTechnician?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {r.assignedTechnician.map((t) => (
                        <span
                          key={t._id}
                          className={`px-2 py-1 text-xs rounded-full text-white ${
                            r.assignedTechnician.length > 1
                              ? "bg-purple-600"
                              : "bg-blue-600"
                          }`}
                        >
                          {t.name}
                        </span>
                      ))}

                      {r.assignedTechnician.length > 1 && (
                        <span className="bg-yellow-400 text-black px-2 py-1 text-xs rounded-full">
                          TEAM
                        </span>
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="border px-3 py-2">
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    onClick={() => {
                      setSelectedRequest(r);
                      setSelectedTechnicians({
                        ...selectedTechnicians,
                        [r._id]:
                          r.assignedTechnician?.map((t) => t._id) || [],
                      });
                      setShowApproveModal(true);
                    }}
                  >
                    Open
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

    <div className="bg-white p-6 rounded-xl w-[520px] shadow-xl">

      {/* TITLE */}
      <h2 className="text-lg font-bold mb-3 text-blue-700">
        {isMaintenance ? "Maintenance Request" : "Request Details"}
      </h2>

      {/* DETAILS */}
      <div className="bg-gray-50 p-3 rounded mb-3 text-sm space-y-1">
        <p><b>Staff:</b> {selectedRequest.staffName}</p>
        <p><b>Type:</b> {selectedRequest.requestType}</p>
        <p><b>Date:</b> {formatDateTime(selectedRequest.createdAt)}</p>
        <p><b>Problem:</b> {selectedRequest.problemDescription || "-"}</p>
      </div>

      {/* TECHNICIAN (ONLY MAINTENANCE) */}
      {isMaintenance && (
        <>
          <h3 className="font-semibold mb-2">Assign Technician</h3>

          <div className="border p-3 rounded h-40 overflow-y-auto mb-3">
            {technicians.map((t) => {
              const selectedList =
                selectedTechnicians[selectedRequest._id] || [];

              return (
                <label
                  key={t._id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition 
                  ${selectedList.includes(t._id)
                    ? "bg-blue-100"
                    : "hover:bg-gray-100"}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedList.includes(t._id)}
                    onChange={(e) => {
                      let updated = [...selectedList];

                      if (e.target.checked) {
                        updated.push(t._id);
                      } else {
                        updated = updated.filter((id) => id !== t._id);
                      }

                      setSelectedTechnicians({
                        ...selectedTechnicians,
                        [selectedRequest._id]: updated,
                      });
                    }}
                  />

                  <span className="text-sm">{t.name}</span>
                </label>
              );
            })}
          </div>

          <button
            className="bg-blue-600 text-white px-3 py-1 rounded mb-3"
            onClick={() => handleAssignTechnician(selectedRequest._id)}
          >
            Assign Technician
          </button>
        </>
      )}

      {/* SIGNATURE */}
      <ApproverSignaturePad
        onChange={(sig) => setSignatureApprover(sig)}
      />

      {/* ACTION BUTTONS */}
      <div className="flex gap-2 mt-4">

        <button
          className="bg-green-600 text-white px-3 py-1 rounded"
          onClick={handleApprove}
        >
          Approve
        </button>

        <button
          className="bg-red-600 text-white px-3 py-1 rounded"
          onClick={handleReject}
        >
          Reject
        </button>

        <button
          className="bg-gray-500 text-white px-3 py-1 rounded"
          onClick={() => {
            setShowApproveModal(false);
            setSignatureApprover("");
          }}
        >
          Close
        </button>

      </div>

    </div>
  </div>
)};

export default ApproverDashboard;
