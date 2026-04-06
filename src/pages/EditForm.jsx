import React, { useEffect, useState } from "react";
import axios from "axios";

const EditForm = ({ requestId, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    title: "",
    requestType: "",
    problemDescription: "",
    items: [], // array of { itemName, quantity, estimatedCost }
  });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // Fetch request data to prefill form
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `https://backenduwleapprovalsystem.onrender.com/api/requests/${requestId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data.request || res.data;
        // Prefill fields
        setFormData({
          title: data.title || "",
          requestType: data.requestType || "",
          problemDescription: data.problemDescription || "",
          items: data.items || [],
        });
      } catch (err) {
        console.error("Failed to fetch request:", err);
        alert("Gagal load request data!");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [requestId, token, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index][field] = value;
      return { ...prev, items: updatedItems };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { itemName: "", quantity: 1, estimatedCost: 0 }],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `https://backenduwleapprovalsystem.onrender.com/api/requests/${requestId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Request updated & resubmitted successfully!");
      onUpdated(res.data.request); // update parent list
    } catch (err) {
      console.error("Edit request failed:", err.response || err);
      alert(err.response?.data?.message || "Gagal update request!");
    }
  };

  if (loading) return <p>Loading request data...</p>;

  return (
    <div
      style={{
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "10px",
        maxWidth: "600px",
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <h2 style={{ marginBottom: "15px", color: "#333" }}>Edit Request</h2>
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div style={{ marginBottom: "10px" }}>
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
          />
        </div>

        {/* Request Type */}
        <div style={{ marginBottom: "10px" }}>
          <label>Request Type:</label>
          <input
            type="text"
            name="requestType"
            value={formData.requestType}
            onChange={handleInputChange}
            required
            style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
          />
        </div>

        {/* Problem Description */}
        <div style={{ marginBottom: "10px" }}>
          <label>Problem Description:</label>
          <textarea
            name="problemDescription"
            value={formData.problemDescription}
            onChange={handleInputChange}
            rows={4}
            style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
          />
        </div>

        {/* Items */}
        <div style={{ marginBottom: "10px" }}>
          <label>Items:</label>
          {formData.items.map((item, idx) => (
            <div key={idx} style={{ display: "flex", gap: "5px", marginBottom: "5px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Item Name"
                value={item.itemName}
                onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                required
                style={{ flex: 2, padding: "6px", borderRadius: "5px", border: "1px solid #ccc" }}
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                required
                style={{ flex: 1, padding: "6px", borderRadius: "5px", border: "1px solid #ccc" }}
              />
              <input
                type="number"
                placeholder="Cost"
                value={item.estimatedCost}
                onChange={(e) => handleItemChange(idx, "estimatedCost", e.target.value)}
                required
                style={{ flex: 1, padding: "6px", borderRadius: "5px", border: "1px solid #ccc" }}
              />
              <button type="button" onClick={() => removeItem(idx)} style={{ backgroundColor: "red", color: "#fff", padding: "4px 8px", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                X
              </button>
            </div>
          ))}
          <button type="button" onClick={addItem} style={{ marginTop: "5px", padding: "6px 12px", borderRadius: "5px", backgroundColor: "green", color: "#fff", border: "none", cursor: "pointer" }}>
            Add Item
          </button>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 15px", borderRadius: "5px", border: "1px solid #ccc", cursor: "pointer" }}>
            Cancel
          </button>
          <button type="submit" style={{ padding: "8px 15px", borderRadius: "5px", backgroundColor: "blue", color: "#fff", border: "none", cursor: "pointer" }}>
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditForm;