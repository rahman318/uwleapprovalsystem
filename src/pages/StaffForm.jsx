import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import SignatureCanvas from "react-signature-canvas";
import { useNavigate } from "react-router-dom";
import* as jwt_decode from "jwt-decode";

// ================= SignaturePad =================
const SignaturePad = forwardRef((props, ref) => {
  const sigRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getSignature: () =>
      !sigRef.current || sigRef.current.isEmpty()
        ? null
        : sigRef.current.toDataURL(),
    clear: () => sigRef.current?.clear(),
  }));

  return (
    <div className="border p-2 rounded">
      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        canvasProps={{ width: 400, height: 150, className: "border" }}
      />
      <button
        type="button"
        onClick={() => sigRef.current?.clear()}
        className="mt-2 bg-red-500 text-white px-3 py-1 rounded"
      >
        Clear
      </button>
    </div>
  );
});

// ================= StaffForm =================
const StaffForm = () => {
  const navigate = useNavigate();

  const [approversList, setApproversList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);

  const signatureRef = useRef(null);

  const token = localStorage.getItem("token");
  const user = token ? jwt_decode(token) : null;

  const [formData, setFormData] = useState({
    requestType: "CUTI",
    details: {},
    approvals: [
      { level: 1, approverId: null },
      { level: 2, approverId: null },
      { level: 3, approverId: null },
      { level: 4, approverId: null },
    ],
    items: [],
    problemDescription: "",
  });

  // ================= FETCH APPROVERS =================
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        const res = await axios.get(
          "https://backenduwleapprovalsystem.onrender.com/api/users/approvers",
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {},
          }
        );
        setApproversList(res.data || []);
      } catch (err) {
        Swal.fire("Error", "Gagal fetch approvers", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchApprovers();
  }, []);

  // ================= HANDLERS =================
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleDetailsChange = (e) =>
    setFormData({
      ...formData,
      details: { ...formData.details, [e.target.name]: e.target.value },
    });

  const handleApproverChange = (level, approverId) => {
    const newApprovals = [...formData.approvals];
    newApprovals[level - 1].approverId = approverId;
    setFormData({ ...formData, approvals: newApprovals });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { itemName: "", quantity: 1, estimatedCost: 0 },
      ],
    });
  };

  const handleItemChange = (index, e) => {
    const newItems = [...formData.items];
    newItems[index][e.target.name] = e.target.value;
    setFormData({ ...formData, items: newItems });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      return Swal.fire("Error", "Session expired, login semula", "error");
    }

    const payload = new FormData();

    payload.append("userId", user._id || user.id);
    payload.append("staffName", user.name || user.username);
    payload.append("requestType", formData.requestType);
    payload.append("details", JSON.stringify(formData.details));
    payload.append("items", JSON.stringify(formData.items));
    payload.append(
      "approvals",
      JSON.stringify(formData.approvals.filter(a => a.approverId))
    );
    payload.append(
      "signatureStaff",
      signatureRef.current?.getSignature() || ""
    );
    payload.append("problemDescription", formData.problemDescription);

    if (file) payload.append("files", file);

    try {
      await axios.post(
        "https://backenduwleapprovalsystem.onrender.com/api/requests",
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire("Success", "Request berjaya dihantar!", "success");

      // 🔥 AUTO REDIRECT KE HISTORY
      navigate("/my-requests");

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal submit request", "error");
    }
  };

  if (loading) return <p className="text-center mt-6">Loading...</p>;

  // ================= UI =================
  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-gray-50 rounded-xl shadow">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Staff Request Form</h2>

        {/* 🔥 BUTTON VIEW HISTORY */}
        <button
          onClick={() => navigate("/my-requests")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          My Requests
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* TYPE */}
        <select
          name="requestType"
          value={formData.requestType}
          onChange={handleChange}
          className="w-full border p-2"
        >
          <option value="CUTI">Cuti</option>
          <option value="PEMBELIAN">Pembelian</option>
          <option value="IT_SUPPORT">IT Support</option>
          <option value="Maintenance">Maintenance</option>
        </select>

        {/* PROBLEM */}
        <textarea
          name="problemDescription"
          placeholder="Problem Description"
          value={formData.problemDescription}
          onChange={handleChange}
          className="w-full border p-2"
        />

        {/* FILE */}
        <input type="file" onChange={handleFileChange} />

        {/* APPROVERS */}
        {[1, 2, 3, 4].map((lvl) => (
          <select
            key={lvl}
            onChange={(e) =>
              handleApproverChange(lvl, e.target.value)
            }
            className="w-full border p-2"
          >
            <option value="">Level {lvl}</option>
            {approversList.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
        ))}

        {/* SIGNATURE */}
        <SignaturePad ref={signatureRef} />

        {/* SUBMIT */}
        <button className="bg-green-500 text-white px-6 py-2 rounded">
          Submit
        </button>
      </form>
    </div>
  );
};

export default StaffForm;
