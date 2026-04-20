import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import SignatureCanvas from "react-signature-canvas";
import { useNavigate } from "react-router-dom";

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
const StaffForm = ({ initialData = null, onClose = null }) => {
  const [staffList, setStaffList] = useState([]);
  const [approversList, setApproversList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);

  const navigate = useNavigate();
  const signatureRef = useRef(null);

  const token = localStorage.getItem("token");

  // ================= FILTER APPROVER BY LEVEL (🔥 NEW FIX) =================
  const getApproversByLevel = (level) => {
    return approversList.filter(
      (a) => Number(a.level) === Number(level)
    );
  };

  // ================= Default Form Data =================
  const defaultFormData = {
    staffId: "",
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
  };

  const [formData, setFormData] = useState(defaultFormData);

  // ================= Update formData from initialData =================
  useEffect(() => {
    if (initialData) {
      setFormData({
        staffId: initialData.staffId || "",
        requestType: initialData.requestType || "CUTI",
        details: initialData.details || {},
        approvals: initialData.approvals || defaultFormData.approvals,
        items: initialData.items || [],
        problemDescription: initialData.problemDescription || "",
      });
    }
  }, [initialData]);

  // ================= Fetch Staff & Approvers =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [staffRes, approverRes] = await Promise.all([
          axios.get("https://backenduwleapprovalsystem.onrender.com/api/users/staff", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          axios.get("https://backenduwleapprovalsystem.onrender.com/api/users/approvers", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        ]);
        setStaffList(staffRes.data || []);
        setApproversList(approverRes.data || []);
      } catch (err) {
        Swal.fire("Error", "Gagal fetch staff atau approvers", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

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
      items: [...formData.items, { itemName: "", quantity: 1, quantityBalance: 0, estimatedCost: 0, supplier: "", reason: "" }],
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
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  // ================= Submit Handler =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const staff = staffList.find((s) => s._id === formData.staffId);
    if (!staff) return Swal.fire("Error", "Sila pilih staff", "error");
    const staffDepartment = staff.department || "-";

    if (formData.requestType === "PEMBELIAN") {
      for (let i = 0; i < formData.items.length; i++) {
        if (!formData.items[i].itemName) {
          return Swal.fire("Error", `Item ${i + 1} belum ada nama item`, "error");
        }
      }
    }

    const signatureData = signatureRef.current?.getSignature() || null;
    const filteredApprovals = formData.approvals.filter(a => a.approverId);

    const payload = new FormData();
    payload.append("userId", staff._id);
    payload.append("staffName", staff.name || staff.username);
    payload.append("requestType", formData.requestType);
    payload.append("details", JSON.stringify(formData.details));
    payload.append("items", JSON.stringify(formData.items));
    payload.append("approvals", JSON.stringify(filteredApprovals));
    payload.append("signatureStaff", signatureData || "");
    payload.append("staffDepartment", staffDepartment);
    payload.append("problemDescription", formData.problemDescription);

    console.log("🚀 FINAL ITEMS BEFORE SEND:", formData.items);
console.log("🚀 STRINGIFIED ITEMS:", JSON.stringify(formData.items));

    if (file) payload.append("files", file);

    try {
      await axios.post("https://backenduwleapprovalsystem.onrender.com/api/requests", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.fire("Success", "Request berjaya dihantar!", "success");

      setFormData(defaultFormData);
      setFile(null);
      signatureRef.current?.clear();

      if (onClose) onClose(); // ✅ close modal jika modal mode
    } catch (err) {
      console.error("❌ Submit Error:", err.response || err);
      Swal.fire("Error", err.response?.data?.message || "Gagal hantar request", "error");
    }
  };

  if (loading) return <p className="text-center mt-6 text-gray-600">Loading...</p>;

  // ================= Render Form =================
  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-gray-50 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Staff Request Form</h2>

      <div className="flex justify-end mb-6">
        {!onClose && (
          <button
            type="button"
            onClick={() => navigate("/my-requests")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded shadow-md flex items-center gap-2"
          >
            View Request History
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Staff & Request Type */}
        <table className="w-full table-auto bg-white rounded shadow-sm overflow-hidden">
          <tbody>
            <tr className="border-b bg-gray-50">
              <td className="py-2 px-4 font-semibold text-gray-700">Nama Staff</td>
              <td className="py-2 px-4">
                <select name="staffId" value={formData.staffId} onChange={handleChange} required className="w-full border border-gray-300 rounded px-3 py-2">
                  <option value="">-- Pilih Staff --</option>
                  {staffList.map(s => <option key={s._id} value={s._id}>{s.name || s.username}</option>)}
                </select>
              </td>
            </tr>
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
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">

              {/* ITEM NAME */}
              <div>
                <label className="block font-semibold text-gray-700">
                  Nama Item
                </label>
                <input
                  type="text"
                  name="itemName"
                  value={item.itemName}
                  onChange={(e) => handleItemChange(idx, e)}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>

              {/* QUANTITY */}
              <div>
                <label className="block font-semibold text-gray-700">
                  Kuantiti
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, e)}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>

              {/* 🔥 NEW FIELD: QUANTITY BALANCE */}
              <div>
                <label className="block font-semibold text-gray-700">
                  Quantity Balance
                </label>
                <input
                  type="number"
                  name="quantityBalance"
                  value={item.quantityBalance || ""}
                  onChange={(e) => handleItemChange(idx, e)}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>

              {/* ESTIMATED COST */}
              <div>
                <label className="block font-semibold text-gray-700">
                  Anggaran Harga (RM)
                </label>
                <input
                  type="number"
                  name="estimatedCost"
                  value={item.estimatedCost}
                  onChange={(e) => handleItemChange(idx, e)}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>

              {/* SUPPLIER */}
              <div>
                <label className="block font-semibold text-gray-700">
                  Pembekal
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={item.supplier}
                  onChange={(e) => handleItemChange(idx, e)}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>

              {/* REASON */}
              <div className="col-span-2">
                <label className="block font-semibold text-gray-700">
                  Tujuan / Reason
                </label>
                <textarea
                  name="reason"
                  value={item.reason}
                  onChange={(e) => handleItemChange(idx, e)}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>

            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="mt-2 bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
        >
          + Add Item
        </button>
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
                    <td className="px-3 py-2"><input type="text" name="location" value={formData.details.location || ""} onChange={handleDetailsChange} className="w-full border px-2 py-1" placeholder="Contoh: Bilik Mesyuarat, Tandas, Blok A" required/></td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="px-3 py-2 font-semibold text-gray-700">Jenis Masalah</td>
                    <td className="px-3 py-2"><input type="text" name="issueType" value={formData.details.issueType || ""} onChange={handleDetailsChange} className="w-full border px-2 py-1" placeholder="Contoh: Paip bocor, Lampu rosak" required/></td>
                  </tr>
                  <tr className="bg-gray-50 border-b">
                    <td className="px-3 py-2 font-semibold text-gray-700">Keutamaan</td>
                    <td className="px-3 py-2">
                      <select name="priority" value={formData.details.priority || "Normal"} onChange={handleDetailsChange} className="w-full border px-2 py-1">
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-3 py-2 font-semibold text-gray-700">Penerangan Masalah</td>
                    <td className="px-3 py-2"><textarea name="description" value={formData.details.description || ""} onChange={handleDetailsChange} className="w-full border px-2 py-1" placeholder="Terangkan masalah dengan jelas..."/></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Problem Description */}
        <div className="mt-4">
          <label className="block font-semibold text-gray-700">Additional Description / Notes</label>
          <textarea
            name="problemDescription"
            value={formData.problemDescription}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded"
            rows={3}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block font-semibold text-gray-700">Attach File (Optional)</label>
          <input type="file" onChange={handleFileChange} className="border px-2 py-1 rounded w-full"/>
          {file && <p className="text-sm mt-1 text-gray-600">Selected: {file.name}</p>}
        </div>

        {/* APPROVERS (🔥 FILTERED BY LEVEL) */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((level) => (
            <select
              key={level}
              value={
                formData.approvals[level - 1]?.approverId || ""
              }
              onChange={(e) =>
                handleApproverChange(level, e.target.value)
              }
              className="border p-2"
            >
              <option value="">
                -- Level {level} Approver --
              </option>

              {getApproversByLevel(level).map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.department})
                </option>
              ))}
            </select>
          ))}
        </div>

        {/* Signature */}
        <div>
          <label className="block font-semibold text-gray-700 mt-4 mb-2">Signature</label>
          <SignaturePad ref={signatureRef} />
        </div>

        {/* Submit */}
        <div className="text-center mt-6">
          <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">Submit Request</button>
        </div>
      </form>
    </div>
  );
};

export default StaffForm;
