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

  // ✅ NEW STATE (MULTI TECH)
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
    date
      ? new Date(date).toLocaleDateString("ms-MY")
      : "-";

  // ================= CUTI =================
  const getTempohCuti = (request) => {
    let detailsObj = {};
    try {
      detailsObj =
        typeof request.details === "string"
          ? JSON.parse(request.details)
          : request.details || {};
    } catch {}

    const start =
      detailsObj.startDate || request.startDate || request.leaveDate;
    const end =
      detailsObj.endDate || request.endDate || request.leaveDate;

    return start && end ? `${formatDate(start)} - ${formatDate(end)}` : "-";
  };

  // ================= PROBLEM =================
  const getProblemDescription = (request) =>
    request.problemDescription?.trim() || "-";

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
    } catch (err) {
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
      return Swal.fire("Error", "Sila tanda sebelum approve!", "error");

    try {
      await axios.put(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/approve-level/${selectedRequest._id}`,
        { signatureApprover },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Success", "Approved", "success");
      setShowApproveModal(false);
      setSignatureApprover("");
      fetchRequests();
    } catch {
      Swal.fire("Error", "Gagal approve", "error");
    }
  };

  // ================= REJECT =================
  const handleReject = async () => {
    if (!signatureApprover)
      return Swal.fire("Error", "Sila tanda sebelum reject!", "error");

    const { value: remark } = await Swal.fire({
      title: "Reject",
      input: "textarea",
      showCancelButton: true,
    });

    if (!remark) return;

    try {
      await axios.put(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/reject-level/${selectedRequest._id}`,
        { signatureApprover, remark },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Rejected", "", "success");
      setShowApproveModal(false);
      fetchRequests();
    } catch {
      Swal.fire("Error", "Gagal reject", "error");
    }
  };

  // ================= MULTI ASSIGN =================
  const handleAssignTechnician = async (requestId) => {
    const techIds = selectedTechnicians[requestId] || [];

    if (techIds.length === 0) {
      return Swal.fire("Error", "Pilih technician dulu!", "error");
    }

    try {
      await axios.put(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/${requestId}/assign-technician`,
        { technicianIds: techIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Success", "Technician Assigned", "success");
      fetchRequests();
    } catch {
      Swal.fire("Error", "Gagal assign", "error");
    }
  };

  // ================= RENDER =================
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">
        Approver Dashboard
      </h1>

      <table className="min-w-full border">
        <thead className="bg-blue-100">
          <tr>
            <th>Staff</th>
            <th>Type</th>
            <th>Tempoh</th>
            <th>Date</th>
            <th>Problem</th>
            <th>Status</th>
            <th>Technician</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((r) => (
            <tr key={r._id}>
              <td>{r.staffName}</td>
              <td>{r.requestType}</td>
              <td>
                {r.requestType === "cuti" ? getTempohCuti(r) : "-"}
              </td>
              <td>{formatDateTime(r.createdAt)}</td>
              <td>{getProblemDescription(r)}</td>
              <td>
                <span className={getStatusBadge(r.finalStatus)}>
                  {r.finalStatus || "Pending"}
                </span>
              </td>

              {/* ✅ DISPLAY MULTIPLE TECH */}
              <td>
                {r.assignedTechnician?.length > 0
                  ? r.assignedTechnician.map((t) => t.name).join(", ")
                  : "-"}
              </td>

              <td>
                <button
                  className="bg-green-600 text-white px-2 py-1"
                  onClick={() => {
                    setSelectedRequest(r);

                    // ✅ AUTO LOAD EXISTING TECH
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

      {/* MODAL */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-[500px]">
            <h2 className="font-bold text-lg mb-3">
              Assign Technician
            </h2>

            {/* ✅ MULTI SELECT */}
            <select
              multiple
              className="border w-full p-2 h-32"
              value={selectedTechnicians[selectedRequest._id] || []}
              onChange={(e) => {
                const values = Array.from(
                  e.target.selectedOptions
                ).map((o) => o.value);

                setSelectedTechnicians({
                  ...selectedTechnicians,
                  [selectedRequest._id]: values,
                });
              }}
            >
              {technicians.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>

            <button
              className="bg-blue-600 text-white px-3 py-1 mt-2"
              onClick={() =>
                handleAssignTechnician(selectedRequest._id)
              }
            >
              Assign
            </button>

            <ApproverSignaturePad
              onChange={(sig) => setSignatureApprover(sig)}
            />

            <div className="flex gap-2 mt-4">
              <button
                className="bg-green-600 text-white px-3 py-1"
                onClick={handleApprove}
              >
                Approve
              </button>

              <button
                className="bg-red-600 text-white px-3 py-1"
                onClick={handleReject}
              >
                Reject
              </button>

              <button
                className="bg-gray-500 text-white px-3 py-1"
                onClick={() => setShowApproveModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproverDashboard;
