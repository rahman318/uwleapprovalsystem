import React, { useEffect, useState } from "react";
import axios from "axios";

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "https://backenduwleapprovalsystem.onrender.com/api/my-requests",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = res.data.requests || res.data || [];
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests
    .filter((r) => ((r.title || "")).toLowerCase().includes(search.toLowerCase()))
    .filter((r) => {
      if (!filter) return true;
      const status = (r.status || "").toLowerCase();
      return status === filter.toLowerCase();
    });

  const statusColor = (status) => {
    if (!status) return "gray";
    const s = status.toLowerCase();
    if (s === "pending") return "orange";
    if (s === "approved") return "green";
    if (s === "rejected") return "red";
    return "gray";
  };

  if (loading) return <p>Loading My Requests...</p>;
  if (!requests.length) return <p>No requests found.</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "15px" }}>My Requests History</h2>

      {/* Search & Filter */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "5px 10px", flex: "1 1 200px" }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "5px 10px", flex: "1 1 150px" }}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Request Cards */}
      {filteredRequests.map((r) => (
        <div
          key={r._id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "15px",
            backgroundColor: "#f9f9f9",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ marginBottom: "8px" }}>{r.title || "Untitled Request"}</h3>
          <p>
            Status:{" "}
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "5px",
                color: "#fff",
                fontWeight: "bold",
                backgroundColor: statusColor(r.status),
              }}
            >
              {r.status || "-"}
            </span>
          </p>
          <p>Created At: {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</p>

          {/* Problem Description */}
          {r.problemDescription && (
            <p><strong>Problem Description:</strong> {r.problemDescription}</p>
          )}

          {/* Items (for PEMBELIAN) */}
          {r.items && r.items.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <strong>Items:</strong>
              {r.items.map((item, idx) => (
                <div key={idx} style={{ marginLeft: "15px", marginTop: "5px" }}>
                  <p>Item {idx + 1}: {item.itemName}</p>
                  <p>Quantity: {item.quantity}</p>
                  <p>Estimated Cost: {item.estimatedCost}</p>
                  <p>Supplier: {item.supplier}</p>
                  <p>Reason: {item.reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* Approvals */}
          {r.approvals && r.approvals.length > 0 && (
            <div
              style={{
                marginTop: "10px",
                paddingLeft: "10px",
                borderLeft: "2px solid #999",
              }}
            >
              <strong>Approvals:</strong>
              {r.approvals.map((a, idx) => {
                const name = a.approverId?.name || "-";
                const email = a.approverId?.email || "-";
                const dept = a.approverId?.department || "-";
                const actionDate = a.actionDate ? new Date(a.actionDate).toLocaleString() : "-";
                return (
                  <div key={idx} style={{ marginBottom: "8px" }}>
                    <p>Level {a.level} - <strong>{a.status}</strong></p>
                    <p>Approver: {name} ({email}) | Dept: {dept}</p>
                    <p>Action Date: {actionDate}</p>
                    <p>Remark: {a.remark || "-"}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Signature info */}
          {r.signatureStaff && (
            <div style={{ marginTop: "10px" }}>
              <strong>Signature:</strong>
              <div>
                <img src={r.signatureStaff} alt="signature" style={{ maxWidth: "200px", maxHeight: "80px", border: "1px solid #ccc" }} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyRequests;
