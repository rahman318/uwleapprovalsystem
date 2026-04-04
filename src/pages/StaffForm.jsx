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

  const BASE_URL = "https://backenduwleapprovalsystem.onrender.com/api";

  // ================= fetch approvers & history =================
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchApprovers = axios.get(`${BASE_URL}/users/approvers`, { headers });
    const fetchHistory = axios.get(`${BASE_URL}/my-requests/${userId}?limit=10`, { headers });

    Promise.all([fetchApprovers, fetchHistory])
      .then(([approversRes, historyRes]) => {
        setApproversList(approversRes.data || []);
        setRequestHistory(historyRes.data || []);
      })
      .catch(err => {
        console.error(err);
        Swal.fire("Error", "Gagal fetch data", "error");
      })
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

    if (!userId) return Swal.fire("Error", "User not found, please login again", "error");

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
      await axios.post(`${BASE_URL}/requests`, payload, {
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
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const historyRes = await axios.get(`${BASE_URL}/my-requests/${userId}?limit=10`, { headers });
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
        {/* Dynamic Details / Items */}
        <div className="overflow-x-auto rounded shadow-sm">
          <table className="w-full table-auto border-collapse">
            <tbody>
              {/* CUTI */}
              {formData.requestType === "CUTI" && (
                <>
                  <tr className="bg-gray-50 border-b"><td className="px-3 py-2 font-semibold text-gray-700">Jenis Cuti</td><td className="px-3 py-2"><input type="text" name="leaveType" value={formData.details.leaveType || ""} onChange={handleDetailsChange} className="w-full border px-2 py-1" required/></td></tr>
                  <tr className="bg-white border-b"><td className="px-3 py-2 font-semibold text-gray-700">Start Date</td><td className="px-3 py-2"><input type="date" name="startDate" value={formData.details.startDate || ""} onChange={handleDetailsChange} className="w-full border px-2 py-1" required/></td></tr>
                  <tr className="bg-gray-50 border-b"><td className="px-3 py-2 font-semibold text-gray-700">End Date</td><td className="px-3 py-2"><input type="date" name="endDate" value={formData.details.endDate || ""} onChange={handleDetailsChange} className="w-full border px-2 py-1" required/></td></tr>
                  <tr className="bg-white"><td className="px-3 py-2 font-semibold text-gray-700">Sebab</td><td className="px-3 py-2"><textarea name="reason" value={formData.details.reason || ""} onChange={handleDetailsChange} className="w-full border px-2 py-1"/></td></tr>
                </>
              )}

              {/* PEMBELIAN */}
              {formData.requestType === "PEMBELIAN" && (
                <tr>
                  <td colSpan={2}>
                    <div className="space-y-4 p-2">
                      {formData.items.map((item, idx) => (
                        <div key={idx} className="border p-3 rounded bg-gray-50">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Item {idx + 1}</h4>
                            <button type="button" onClick={() => removeItem(idx)} className="text-red-500 text-sm">Remove</button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block font-semibold text-gray-700">Nama Item</label>
                              <input type="text" name="itemName" value={item.itemName} onChange={(e)=>handleItemChange(idx,e)} className="w-full border px-2 py-1 rounded"/>
                            </div>
                            <div>
                              <label className="block font-semibold text-gray-700">Kuantiti</label>
                              <input type="number" name="quantity" value={item.quantity} onChange={(e)=>handleItemChange(idx,e)} className="w-full border px-2 py-1 rounded"/>
                            </div>
                            <div>
                              <label className="block font-semibold text-gray-700">Anggaran Harga (RM)</label>
                              <input type="number" name="estimatedCost" value={item.estimatedCost} onChange={(e)=>handleItemChange(idx,e)} className="w-full border px-2 py-1 rounded"/>
                            </div>
                            <div>
                              <label className="block font-semibold text-gray-700">Pembekal</label>
                              <input type="text" name="supplier" value={item.supplier} onChange={(e)=>handleItemChange(idx,e)} className="w-full border px-2 py-1 rounded"/>
                            </div>
                            <div className="col-span-2">
                              <label className="block font-semibold text-gray-700">Tujuan / Reason</label>
                              <textarea name="reason" value={item.reason} onChange={(e)=>handleItemChange(idx,e)} className="w-full border px-2 py-1 rounded"/>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addItem} className="mt-2 bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600">+ Add Item</button>
                    </div>
                  </td>
                </tr>
              )}

              {/* IT_SUPPORT */}
              {formData.requestType === "IT_SUPPORT" && (
                <>
                  <tr className="bg-gray-50 border-b"><td className="px-3 py-2 font-semibold text-gray-700">Jenis Masalah</td><td className="px-3 py-2"><input type="text" name="issueType" value={formData.details.issueType || ""} onChange={handleDetailsChange} className="w-full border px-2 py-1" required/></td></tr>
                  <tr className="bg-white border-b"><td className="px-3 py-2 font-semibold text-gray-700">Priority</td><td className="px-3 py-2"><select name="priority" value={formData.details.priority || ""} onChange={handleDetailsChange} className="w-full border px-2 py-1"><option value="Normal">Normal</option><option value="High">High</option><option value="Urgent">Urgent</option></select></td></tr>
                  <tr className="bg-gray-50"><td className="px-3 py-2 font-semibold text-gray-700">Description</td><td className="px-3 py-2"><textarea name="description" value={formData.details.description || ""} onChange={handleDetailsChange} className="w-full border px-2 py-1"/></td></tr>
                </>
              )}

              {/* MAINTENANCE JOB REQUEST */}
              {formData.requestType === "Maintenance" && (
                <>
                  <tr className="bg-gray-50 border-b">
                    <td className="px-3 py-2 font-semibold text-gray-700">Lokasi Kerosakan</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        name="location"
                        value={formData.details.location || ""}
                        onChange={handleDetailsChange}
                        className="w-full border px-2 py-1"
                        placeholder="Contoh: Bilik Mesyuarat, Tandas, Blok A"
                        required
                      />
                    </td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="px-3 py-2 font-semibold text-gray-700">Jenis Masalah</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        name="issueType"
                        value={formData.details.issueType || ""}
                        onChange={handleDetailsChange}
                        className="w-full border px-2 py-1"
                        placeholder="Contoh: Paip bocor, Lampu rosak"
                        required
                      />
                    </td>
                  </tr>
                  <tr className="bg-gray-50 border-b">
                    <td className="px-3 py-2 font-semibold text-gray-700">Keutamaan</td>
                    <td className="px-3 py-2">
                      <select
                        name="priority"
                        value={formData.details.priority || "Normal"}
                        onChange={handleDetailsChange}
                        className="w-full border px-2 py-1"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-3 py-2 font-semibold text-gray-700">Penerangan Masalah</td>
                    <td className="px-3 py-2">
                      <textarea
                        name="description"
                        value={formData.details.description || ""}
                        onChange={handleDetailsChange}
                        className="w-full border px-2 py-1"
                        placeholder="Terangkan masalah dengan jelas..."
                      />
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
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
