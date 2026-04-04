import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import SignatureCanvas from "react-signature-canvas";
import { useNavigate } from "react-router-dom";
import jwtDecode from "jwt-decode";

// ================= SignaturePad =================
const SignaturePad = forwardRef((props, ref) => {
  const sigRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getSignature: () =>
      !sigRef.current || sigRef.current.isEmpty() ? null : sigRef.current.toDataURL(),
    clear: () => sigRef.current?.clear(),
  }));

  const clear = () => sigRef.current?.clear();

  return (
    <div className="border p-2 rounded">
      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{ width: 400, height: 150, className: "border" }}
      />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={clear} className="bg-red-500 text-white px-3 py-1 rounded">
          Clear
        </button>
      </div>
    </div>
  );
});

// ================= StaffForm =================
const StaffForm = () => {
  const navigate = useNavigate();
  const [approversList, setApproversList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);

  const signatureRef = useRef(null);
  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null; // ✅ FIXED

  const [formData, setFormData] = useState({
    requestType: "CUTI",
    details: {},
    approvals: [
      { level: 1, approverId: null, status: "Pending", approverName: "-" },
      { level: 2, approverId: null, status: "Pending", approverName: "-" },
      { level: 3, approverId: null, status: "Pending", approverName: "-" },
      { level: 4, approverId: null, status: "Pending", approverName: "-" },
    ],
    items: [],
    problemDescription: "",
  });

  // ================= Fetch Approvers =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [approversRes, historyRes] = await Promise.all([
          axios.get(
            "https://backenduwleapprovalsystem.onrender.com/api/users/approvers",
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          ),
          axios.get(
            `https://backenduwleapprovalsystem.onrender.com/api/requests/user/${user?._id}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          ),
        ]);

        setApproversList(approversRes.data || []);
        setRequestHistory(historyRes.data || []);
      } catch (err) {
        console.error("Fetch Error:", err);
        Swal.fire("Error", "Gagal fetch data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, user]);

  // ================= Handlers =================
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleDetailsChange = (e) =>
    setFormData({ ...formData, details: { ...formData.details, [e.target.name]: e.target.value } });

  const handleApproverChange = (level, approverId) => {
    const newApprovals = [...formData.approvals];
    const approver = approversList.find((a) => a._id === approverId);
    newApprovals[level - 1] = {
      level,
      approverId: approverId || null,
      status: "Pending",
      approverName: approver?.name || "-",
    };
    setFormData({ ...formData, approvals: newApprovals });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { itemName: "", quantity: 1, estimatedCost: 0, supplier: "", reason: "" },
      ],
    });
  };

  const removeItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, e) => {
    const newItems = [...formData.items];
    newItems[index][e.target.name] = e.target.value;
    setFormData({ ...formData, items: newItems });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
    else setFile(null);
  };

  // ================= Submit Form =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const signatureData = signatureRef.current?.getSignature() || null;
    const filteredApprovals = formData.approvals.filter((a) => a.approverId);

    const payload = new FormData();
    payload.append("userId", user._id);
    payload.append("staffName", user.name || user.username);
    payload.append("requestType", formData.requestType);
    payload.append("details", JSON.stringify(formData.details));
    payload.append("items", JSON.stringify(formData.items));
    payload.append("approvals", JSON.stringify(filteredApprovals));
    payload.append("signatureStaff", signatureData || "");
    payload.append("problemDescription", formData.problemDescription);

    if (file) payload.append("files", file);

    try {
      await axios.post(
        "https://backenduwleapprovalsystem.onrender.com/api/requests",
        payload,
        { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } }
      );
      Swal.fire("Success", "Request berjaya dihantar!", "success");

      // reset form
      setFormData({
        requestType: "CUTI",
        details: {},
        approvals: [
          { level: 1, approverId: null, status: "Pending", approverName: "-" },
          { level: 2, approverId: null, status: "Pending", approverName: "-" },
          { level: 3, approverId: null, status: "Pending", approverName: "-" },
          { level: 4, approverId: null, status: "Pending", approverName: "-" },
        ],
        items: [],
        problemDescription: "",
      });
      setFile(null);
      signatureRef.current?.clear();

      // refresh request history
      const historyRes = await axios.get(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/user/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequestHistory(historyRes.data || []);
    } catch (err) {
      console.error("Submit Error:", err.response || err);
      Swal.fire("Error", err.response?.data?.message || "Gagal hantar request", "error");
    }
  };

  if (loading) return <p className="text-center mt-6 text-gray-600">Loading...</p>;

  // ================= Render =================
  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-gray-50 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Staff Request Form</h2>
        <button
          type="button"
          onClick={() => navigate("/my-requests")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          My Requests
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type */}
        <div className="flex gap-4 items-center">
          <label className="font-semibold">Jenis Permohonan</label>
          <select
            name="requestType"
            value={formData.requestType}
            onChange={handleChange}
            className="border px-2 py-1 rounded"
          >
            <option value="CUTI">Cuti</option>
            <option value="PEMBELIAN">Pembelian</option>
            <option value="IT_SUPPORT">IT Support</option>
            <option value="Maintenance">Maintenance Job Request</option>
          </select>
        </div>

        {/* Dynamic Form */}
        {/* CUTI / PEMBELIAN / IT_SUPPORT / Maintenance handled same as your previous code */}
        {/* ... copy your dynamic table code here ... */}

        {/* File Upload */}
        <div>
          <label className="font-semibold">Upload File (Optional)</label>
          <input type="file" onChange={handleFileChange} className="border px-2 py-1 rounded w-full" />
          {file && <p className="text-sm mt-1 text-gray-600">Selected: {file.name}</p>}
        </div>

        {/* Multi-Level Approvers */}
        <div className="space-y-2">
          <label className="font-semibold">Pilih Approvers (Level 1-4)</label>
          {[1,2,3,4].map(level => (
            <select
              key={level}
              value={formData.approvals[level-1]?.approverId || ""}
              onChange={e => handleApproverChange(level, e.target.value)}
              className="w-full border px-2 py-1 rounded"
            >
              <option value="">-- Level {level} Approver --</option>
              {approversList.map(a => <option key={a._id} value={a._id}>{a.name} ({a.department})</option>)}
            </select>
          ))}
        </div>

        {/* Signature */}
        <div>
          <label className="font-semibold">Signature Staff</label>
          <SignaturePad ref={signatureRef} />
        </div>

        {/* Submit */}
        <div className="text-center">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded"
          >
            Submit Request
          </button>
        </div>
      </form>

      {/* ================= Request History ================= */}
      <div className="mt-10">
        <h3 className="text-2xl font-bold mb-4">My Request History</h3>
        {requestHistory.length === 0 ? (
          <p>No requests yet.</p>
        ) : (
          <table className="w-full table-auto border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-1">Date</th>
                <th className="border px-3 py-1">Type</th>
                <th className="border px-3 py-1">Status</th>
                <th className="border px-3 py-1">Details</th>
              </tr>
            </thead>
            <tbody>
              {requestHistory.map(req => (
                <tr key={req._id} className="border-b">
                  <td className="px-3 py-1">{new Date(req.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-1">{req.requestType}</td>
                  <td className="px-3 py-1">{req.approvals.every(a=>a.status==="Approved") ? "Approved" : "Pending"}</td>
                  <td className="px-3 py-1">{JSON.stringify(req.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StaffForm;
