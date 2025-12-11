import React, { useState, useEffect } from "react";
import SignaturePad from "../pages/SignaturePad"; 
import axios from "axios";
import Swal from "sweetalert2";

const StaffForm = () => {
  const [staffList, setStaffList] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [formData, setFormData] = useState({
    staffId: "",
    requestType: "Cuti",
    leaveStart: "",
    leaveEnd: "",
    details: "",
    approver: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staffSignature, setStaffSignature] = useState("");
  const [items, setItems] = useState([{ qty: "", description: "", remarks: "" }]);

  const addItemRow = () => setItems([...items, { qty: "", description: "", remarks: "" }]);
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };
  const removeItemRow = (index) =>
    setItems(items.filter((_, i) => i !== index));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [staffRes, approverRes] = await Promise.all([
          axios.get("https://backenduwleapprovalsystem.onrender.com/api/users/staff"),
          axios.get("https://backenduwleapprovalsystem.onrender.com/api/users/approvers"),
        ]);
        setStaffList(staffRes.data || []);
        setApprovers(approverRes.data || []);
      } catch {
        Swal.fire("Error", "Gagal fetch staff/approvers", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.staffId) return Swal.fire("Error", "Sila pilih staff.", "error");
    if (!formData.approver) return Swal.fire("Error", "Sila pilih approver.", "error");

    const staffName = staffList.find((s) => s._id === formData.staffId)?.name || "";
    const submissionData = new FormData();
    submissionData.append("userId", formData.staffId);
    submissionData.append("staffName", staffName);
    submissionData.append("requestType", formData.requestType);

    if (formData.requestType === "Cuti") {
      submissionData.append("leaveStart", formData.leaveStart);
      submissionData.append("leaveEnd", formData.leaveEnd);
    }

    if (formData.requestType === "Pembelian") {
      submissionData.append(
        "items",
        JSON.stringify(
          items.map((i) => ({
            itemName: i.description,
            quantity: i.qty,
            remarks: i.remarks,
          }))
        )
      );
    }

    submissionData.append("details", formData.details);
    const selectedApprover = approvers.find(a => a._id === formData.approver);
    submissionData.append("approver", selectedApprover._id);
    submissionData.append("approverName", selectedApprover.name || selectedApprover.username);
    submissionData.append("approverDepartment", selectedApprover.role || "N/A");
    submissionData.append("signatureStaff", staffSignature);
    if (file) submissionData.append("file", file);

    try {
      await axios.post("https://backenduwleapprovalsystem.onrender.com/api/requests", submissionData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire("Success", "Request berjaya dihantar!", "success");
      setFormData({ staffId: "", requestType: "Cuti", leaveStart: "", leaveEnd: "", details: "", approver: "" });
      setItems([{ qty: "", description: "", remarks: "" }]);
      setFile(null);
    } catch {
      Swal.fire("Error", "Gagal hantar request", "error");
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-blue-50 to-blue-100 py-10 font-[Inter]">

      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <img src="/company logo.png" alt="Company Logo" className="h-20 w-auto mb-3" />
        <h1 className="text-3xl font-bold text-gray-800 tracking-wide">e-Approval Portal</h1>
      </div>

      {/* Form Container */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full max-w-3xl">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center border-b pb-2">
          Staff Request Form
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Staff */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Nama Staff</label>
            <select
              name="staffId"
              value={formData.staffId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
              required
            >
              <option value="">-- Pilih Staff --</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name || s.username} ({s.department || "N/A"})
                </option>
              ))}
            </select>
          </div>

          {/* Request Type */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Jenis Permohonan</label>
            <select
              name="requestType"
              value={formData.requestType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
            >
              <option value="Cuti">Cuti</option>
              <option value="Pembelian">Pembelian</option>
              <option value="IT Support">IT Support</option>
            </select>
          </div>

          {/* Tarikh Cuti */}
          {formData.requestType === "Cuti" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Tarikh Mula</label>
                <input type="date" name="leaveStart" value={formData.leaveStart} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Tarikh Akhir</label>
                <input type="date" name="leaveEnd" value={formData.leaveEnd} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" required />
              </div>
            </div>
          )}

          {/* Pembelian Section */}
          {formData.requestType === "Pembelian" && (
            <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
              <table className="w-full text-sm border border-gray-300 border-collapse">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 px-2 py-1 text-center w-16">Qty</th>
                    <th className="border border-gray-300 px-2 py-1">Deskripsi</th>
                    <th className="border border-gray-300 px-2 py-1">Catatan</th>
                    <th className="border border-gray-300 px-2 py-1 text-center w-12">Buang</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="border border-gray-300 p-1 text-center">
                        <input type="number" value={item.qty}
                          onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                          className="border border-gray-300 rounded w-full px-2 py-1 text-center" required />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="text" value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          className="border border-gray-300 rounded w-full px-2 py-1" required />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="text" value={item.remarks}
                          onChange={(e) => handleItemChange(index, "remarks", e.target.value)}
                          className="border border-gray-300 rounded w-full px-2 py-1" />
                      </td>
                      <td className="border border-gray-300 text-center">
                        {items.length > 1 && (
                          <button type="button" className="text-red-600 font-bold hover:text-red-800"
                            onClick={() => removeItemRow(index)}>✖</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={addItemRow}
                className="mt-3 bg-green-600 text-white px-4 py-1 rounded-md font-semibold shadow hover:bg-green-700 transition transform hover:-translate-y-0.5 hover:scale-105">
                + Tambah Item
              </button>
            </div>
          )}

          {/* Details */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Butiran / Tujuan</label>
            <textarea name="details" value={formData.details} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" rows="3" required />
          </div>

          {/* Approver */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Kelulusan Oleh</label>
            <select name="approver" value={formData.approver} onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500" required>
              <option value="">-- Pilih Approver --</option>
              {approvers.map((a) => (
                <option key={a._id} value={a._id}>{a.name || a.username} ({a.role})</option>
              ))}
            </select>
          </div>

          {/* Lampiran */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Lampiran (Jika Ada)</label>
            <input type="file" onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>

          {/* Signature */}
          <div className="mt-4 border-t border-gray-200 pt-3">
            <h4 className="font-semibold text-gray-700 mb-2">Tandatangan Staff</h4>
            <SignaturePad onSave={(sig) => setStaffSignature(sig)} />
          </div>

          {/* Submit Button */}
          <button type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-0.5 hover:scale-105 mt-4">
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffForm;
