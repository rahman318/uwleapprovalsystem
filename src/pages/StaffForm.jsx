import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import SignatureCanvas from "react-signature-canvas";
import jwtDecode from "jwt-decode";

// ================= SignaturePad =================
const SignaturePad = forwardRef((props, ref) => {
  const sigRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getSignature: () => (sigRef.current?.isEmpty() ? null : sigRef.current.toDataURL()),
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
        <button type="button" onClick={clear} className="bg-red-500 text-white px-3 py-1 rounded">Clear</button>
      </div>
    </div>
  );
});

// ================= StaffForm =================
const StaffForm = () => {
  const [approversList, setApproversList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);

  const signatureRef = useRef(null);

  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null;
  const userId = user?._id;

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

  // ================= fetch approvers & history =================
  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    // fetch approvers first
    axios.get("https://backenduwleapprovalsystem.onrender.com/api/users/approvers", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setApproversList(res.data || []))
      .catch(err => Swal.fire("Error", "Gagal fetch approvers", "error"));

    // fetch user's request history (lazy, limit 10)
    axios.get(`https://backenduwleapprovalsystem.onrender.com/api/requests/user/${userId}?limit=10`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setRequestHistory(res.data || []))
      .catch(err => console.error("Failed fetch history:", err))
      .finally(() => setLoading(false));
  }, [userId, token]);

  // ================= handlers =================
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleDetailsChange = (e) => setFormData({ ...formData, details: { ...formData.details, [e.target.name]: e.target.value } });

  const handleApproverChange = (level, approverId) => {
    const newApprovals = [...formData.approvals];
    const approver = approversList.find(a => a._id === approverId);
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
      items: [...formData.items, { itemName: "", quantity: 1, estimatedCost: 0, supplier: "", reason: "" }],
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

  // ================= submit =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const signatureData = signatureRef.current?.getSignature() || null;
    const filteredApprovals = formData.approvals.filter(a => a.approverId);

    const payload = new FormData();
    payload.append("userId", userId);
    payload.append("staffName", user?.name || user?.username);
    payload.append("requestType", formData.requestType);
    payload.append("details", JSON.stringify(formData.details));
    payload.append("items", JSON.stringify(formData.items));
    payload.append("approvals", JSON.stringify(filteredApprovals));
    payload.append("signatureStaff", signatureData || "");
    payload.append("problemDescription", formData.problemDescription);

    if (file) payload.append("files", file);

    try {
      await axios.post("https://backenduwleapprovalsystem.onrender.com/api/requests", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
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

      // reload history
      const historyRes = await axios.get(`https://backenduwleapprovalsystem.onrender.com/api/requests/user/${userId}?limit=10`, { headers: { Authorization: `Bearer ${token}` } });
      setRequestHistory(historyRes.data || []);
    } catch (err) {
      console.error("❌ Submit Error:", err.response || err);
      Swal.fire("Error", err.response?.data?.message || "Gagal hantar request", "error");
    }
  };

  if (loading) return <p className="text-center mt-6 text-gray-600">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-gray-50 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Staff Request Form</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type */}
        <table className="w-full table-auto bg-white rounded shadow-sm overflow-hidden">
          <tbody>
            <tr className="border-b bg-gray-50">
              <td className="py-2 px-4 font-semibold text-gray-700">Jenis Permohonan</td>
              <td className="py-2 px-4">
                <select name="requestType" value={formData.requestType} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2">
                  <option value="CUTI">Cuti</option>
                  <option value="PEMBELIAN">Pembelian</option>
                  <option value="IT_SUPPORT">IT Support</option>
                  <option value="Maintenance">Maintenance Job Request</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        {/* Dynamic form details */}
        {formData.requestType === "CUTI" && (
          <div>
            <label className="block font-semibold mb-1">Butiran Cuti</label>
            <input
              type="text"
              name="leaveReason"
              placeholder="Sebab cuti"
              value={formData.details.leaveReason || ""}
              onChange={handleDetailsChange}
              className="w-full border px-3 py-2 rounded mb-2"
            />
          </div>
        )}

        {formData.requestType === "PEMBELIAN" && (
          <div>
            <h3 className="font-semibold mb-2">Senarai Item Pembelian</h3>
            {formData.items.map((item, idx) => (
              <div key={idx} className="mb-2 border p-2 rounded">
                <input
                  type="text"
                  name="itemName"
                  placeholder="Nama Item"
                  value={item.itemName}
                  onChange={(e) => handleItemChange(idx, e)}
                  className="w-full border px-2 py-1 rounded mb-1"
                />
                <input
                  type="number"
                  name="quantity"
                  placeholder="Kuantiti"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, e)}
                  className="w-full border px-2 py-1 rounded mb-1"
                />
                <input
                  type="number"
                  name="estimatedCost"
                  placeholder="Anggaran Kos"
                  value={item.estimatedCost}
                  onChange={(e) => handleItemChange(idx, e)}
                  className="w-full border px-2 py-1 rounded mb-1"
                />
                <input
                  type="text"
                  name="supplier"
                  placeholder="Pembekal"
                  value={item.supplier}
                  onChange={(e) => handleItemChange(idx, e)}
                  className="w-full border px-2 py-1 rounded mb-1"
                />
                <input
                  type="text"
                  name="reason"
                  placeholder="Sebab Pembelian"
                  value={item.reason}
                  onChange={(e) => handleItemChange(idx, e)}
                  className="w-full border px-2 py-1 rounded mb-1"
                />
                <button type="button" onClick={() => removeItem(idx)} className="bg-red-500 text-white px-2 py-1 rounded">
                  Remove Item
                </button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="bg-green-500 text-white px-3 py-1 rounded mt-2">
              Add Item
            </button>
          </div>
        )}

        {/* Problem Description */}
        <div className="mt-4">
          <label className="block mb-2 font-semibold text-gray-700">Problem Description</label>
          <textarea
            name="problemDescription"
            value={formData.problemDescription}
            onChange={e => setFormData({ ...formData, problemDescription: e.target.value })}
            className="w-full border px-2 py-1 rounded"
            rows={3}
            placeholder="Terangkan masalah / penerangan ringkas..."
            required
          />
        </div>

        {/* File Upload */}
        <div className="mt-4">
          <label className="block mb-2 font-semibold text-gray-700">Upload File (Optional)</label>
          <input type="file" onChange={handleFileChange} className="border px-2 py-1 rounded w-full"/>
          {file && <p className="text-sm mt-1 text-gray-600">Selected: {file.name}</p>}
        </div>

        {/* Multi-Level Approvers */}
        <div className="mt-4 space-y-2">
          <label className="block mb-2 font-semibold text-gray-700">Pilih Approvers (Level 1,2,3,4)</label>
          {[1,2,3,4].map(level => (
            <select
              key={level}
              value={formData.approvals[level-1]?.approverId || ""}
              onChange={e => handleApproverChange(level, e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">-- Level {level} Approver --</option>
              {approversList.map(a => <option key={a._id} value={a._id}>{a.name} ({a.department})</option>)}
            </select>
          ))}
        </div>

        {/* Signature */}
        <div className="mt-4">
          <label className="block mb-2 font-semibold text-gray-700">Signature Staff</label>
          <div className="border border-gray-300 rounded p-2 bg-white">
            <SignaturePad ref={signatureRef} />
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6 text-center">
          <button type="submit" className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold py-2 px-6 rounded shadow-md">Submit Request</button>
        </div>
      </form>

      {/* Request History */}
      <div className="mt-10">
        <h3 className="text-2xl font-semibold mb-4">Request History (Last 10)</h3>
        {requestHistory.length === 0 ? (
          <p className="text-gray-600">Tiada request ditemui.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Jenis Permohonan</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Tarikh</th>
              </tr>
            </thead>
            <tbody>
              {requestHistory.map(req => (
                <tr key={req._id} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{req.requestType}</td>
                  <td className="border px-2 py-1">{req.approvals.some(a => a.status === "Pending") ? "Pending" : "Completed"}</td>
                  <td className="border px-2 py-1">{new Date(req.createdAt).toLocaleDateString()}</td>
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
