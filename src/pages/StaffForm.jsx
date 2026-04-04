import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import SignatureCanvas from "react-signature-canvas";
import { useNavigate } from "react-router-dom";
import { default as jwtDecode } from "jwt-decode";

// ================= SignaturePad =================
const SignaturePad = forwardRef((props, ref) => {
  const sigRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getSignature: () => (!sigRef.current || sigRef.current.isEmpty() ? null : sigRef.current.toDataURL()),
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
  const [staffList, setStaffList] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);

  const signatureRef = useRef(null);

  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null;

  const [formData, setFormData] = useState({
    staffId: user?._id || "",
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

  // ================= Fetch Approvers & Staff =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [approversRes, staffRes] = await Promise.all([
          axios.get("https://backenduwleapprovalsystem.onrender.com/api/users/approvers", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          axios.get("https://backenduwleapprovalsystem.onrender.com/api/users/staff", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        ]);
        setApproversList(approversRes.data || []);
        setStaffList(staffRes.data || []);
      } catch (err) {
        Swal.fire("Error", "Gagal fetch data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ================= Fetch Staff Request History =================
  useEffect(() => {
    const fetchHistory = async () => {
      if (!formData.staffId) return;
      try {
        const res = await axios.get(`https://backenduwleapprovalsystem.onrender.com/api/requests/staff/${formData.staffId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setRequestHistory(res.data || []);
      } catch (err) {
        console.error("❌ Gagal fetch request history", err);
      }
    };
    fetchHistory();
  }, [formData.staffId]);

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

  // ================= Submit Form =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const staff = staffList.find((s) => s._id === formData.staffId);
    if (!staff) return Swal.fire("Error", "Sila pilih staff", "error");
    const staffDepartment = staff.department || "-";

    if (formData.requestType === "PEMBELIAN") {
      for (let i = 0; i < formData.items.length; i++) {
        if (!formData.items[i].itemName)
          return Swal.fire("Error", `Item ${i + 1} belum ada nama item`, "error");
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
    if (file) payload.append("files", file);

    try {
      await axios.post("https://backenduwleapprovalsystem.onrender.com/api/requests", payload, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });
      Swal.fire("Success", "Request berjaya dihantar!", "success");

      // reset form
      setFormData({
        staffId: user?._id || "",
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
    } catch (err) {
      console.error("❌ Submit Error:", err.response || err);
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
        {/* Staff Select */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Pilih Staff</label>
          <select
            name="staffId"
            value={formData.staffId}
            onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">-- Pilih Staff --</option>
            {staffList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.department})
              </option>
            ))}
          </select>
        </div>

        {/* Request History */}
        {requestHistory.length > 0 && (
          <div className="mb-4 p-3 border rounded bg-white">
            <h3 className="font-semibold mb-2">Request History</h3>
            <ul className="list-disc pl-5 text-gray-700">
              {requestHistory.map((r) => (
                <li key={r._id}>
                  {r.requestType} - {r.approvals[0]?.status || "Pending"} - {new Date(r.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Request Type */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Jenis Permohonan</label>
          <select
            name="requestType"
            value={formData.requestType}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="CUTI">Cuti</option>
            <option value="PEMBELIAN">Pembelian</option>
            <option value="IT_SUPPORT">IT Support</option>
            <option value="Maintenance">Maintenance Job Request</option>
          </select>
        </div>

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
