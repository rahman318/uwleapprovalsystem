import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import SignatureCanvas from "react-signature-canvas";
import jwtDecode from "jwt-decode"; // pastikan pakai jwt-decode@3.1.2

// ================= SignaturePad =================
const SignaturePad = forwardRef((props, ref) => {
  const sigRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getSignature: () => {
      if (!sigRef.current || sigRef.current.isEmpty()) return null;
      return sigRef.current.toDataURL();
    },
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

  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null;
  const userId = user?._id;

  // ================= Fetch Approvers & Request History =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [approverRes, historyRes] = await Promise.all([
          axios.get("https://backenduwleapprovalsystem.onrender.com/api/users/approvers", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          axios.get(`https://backenduwleapprovalsystem.onrender.com/api/requests/user/${userId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        ]);

        setApproversList(approverRes.data || []);
        setRequestHistory(historyRes.data || []);
      } catch (err) {
        Swal.fire("Error", "Gagal fetch approvers atau request history", "error");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId, token]);

  // ================= Handlers =================
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleDetailsChange = (e) => setFormData({ ...formData, details: { ...formData.details, [e.target.name]: e.target.value } });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return Swal.fire("Error", "User tidak dikenali", "error");

    const signatureData = signatureRef.current?.getSignature() || null;
    const filteredApprovals = formData.approvals.filter(a => a.approverId);

    const payload = new FormData();
    payload.append("userId", userId);
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

      // refresh history
      const historyRes = await axios.get(`https://backenduwleapprovalsystem.onrender.com/api/requests/user/${userId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
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

      {/* ================= Request History ================= */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Request History</h3>
        {requestHistory.length === 0 ? (
          <p className="text-gray-600">Tiada rekod permohonan.</p>
        ) : (
          <div className="overflow-x-auto rounded shadow-sm">
            <table className="w-full table-auto border-collapse border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 border">Tarikh</th>
                  <th className="px-2 py-1 border">Jenis</th>
                  <th className="px-2 py-1 border">Status</th>
                  <th className="px-2 py-1 border">Approvers</th>
                </tr>
              </thead>
              <tbody>
                {requestHistory.map((req) => (
                  <tr key={req._id} className="bg-white border-b">
                    <td className="px-2 py-1 border">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="px-2 py-1 border">{req.requestType}</td>
                    <td className="px-2 py-1 border">{req.approvals.every(a=>a.status==="Approved") ? "Approved" : req.approvals.some(a=>a.status==="Rejected") ? "Rejected" : "Pending"}</td>
                    <td className="px-2 py-1 border">{req.approvals.map(a => a.approverName).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type & Details - rest same as before */}
        <table className="w-full table-auto bg-white rounded shadow-sm overflow-hidden">
          <tbody>
            <tr className="border-b bg-white">
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

        {/* Signature */}
        <div>
          <label className="block font-semibold mb-1">Tandatangan Staff</label>
          <SignaturePad ref={signatureRef} />
        </div>

        {/* Approvers */}
        <div>
          <h3 className="font-semibold mb-2">Pilih Approvers</h3>
          {formData.approvals.map((a, idx) => (
            <div key={idx} className="mb-2">
              <label>Level {a.level}</label>
              <select
                value={a.approverId || ""}
                onChange={(e) => handleApproverChange(a.level, e.target.value)}
                className="w-full border px-2 py-1 rounded"
              >
                <option value="">-- Pilih Approver --</option>
                {approversList.map((ap) => (
                  <option key={ap._id} value={ap._id}>
                    {ap.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-6 text-center">
          <button
            type="submit"
            className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold py-2 px-6 rounded shadow-md"
          >
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
};

export default StaffForm;
