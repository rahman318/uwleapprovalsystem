import React, { useEffect, useState } from "react";
import axios from "axios";

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Helper untuk ambil status sebenar
  const getRequestStatus = (r) => {
    // Jika backend ada r.status terus
    if (r.status) return r.status;
    // Ambil status dari approval terakhir
    if (r.approvals && r.approvals.length) {
      return r.approvals[r.approvals.length - 1].status || "Pending";
    }
    return "Pending";
  };

  const statusColor = (status) => {
    switch (status) {
      case "Pending":
        return "orange";
      case "Approved":
        return "green";
      case "Rejected":
        return "red";
      default:
        return "gray";
    }
  };

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
    .filter((r) => (r.title || "").toLowerCase().includes(search.toLowerCase()))
    .filter((r) => !filter || getRequestStatus(r) === filter);

  if (loading) return <p>Loading My Requests...</p>;
  if (!requests.length) return <p>No requests found.</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2 style={{ fontSize: "24px", marginBottom: "15px" }}>My Requests History</h2>

      {/* Search & Filter */}
      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "5px", marginRight: "10px", width: "200px" }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "5px" }}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* List Requests */}
      {filteredRequests.map((r) => {
        const status = getRequestStatus(r);

        return (
          <div
            key={r._id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "15px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <h3 style={{ fontSize: "18px", marginBottom: "5px" }}>
              {r.title || "-"}
            </h3>

            <p>
              Status:{" "}
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "5px",
                  color: "#fff",
                  fontWeight: "bold",
                  backgroundColor: statusColor(status),
                }}
              >
                {status}
              </span>
            </p>

            <p>Created At: {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</p>

            {/* Request Details */}
            {r.details && Object.keys(r.details).length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <strong>Details:</strong>
                <ul style={{ marginLeft: "15px" }}>
                  {Object.entries(r.details).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value || "-"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Items (for Pembelian) */}
            {r.items && r.items.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <strong>Items:</strong>
                <ul style={{ marginLeft: "15px" }}>
                  {r.items.map((item, idx) => (
                    <li key={idx}>
                      {item.itemName || "-"} | Qty: {item.quantity || 0} | Cost: {item.estimatedCost || 0} | Supplier: {item.supplier || "-"} | Reason: {item.reason || "-"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Problem Description */}
            {r.problemDescription && (
              <p style={{ marginTop: "10px" }}>
                <strong>Problem Description:</strong> {r.problemDescription}
              </p>
            )}

            {/* File */}
            {r.files && r.files.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <strong>Attachments:</strong>
                <ul style={{ marginLeft: "15px" }}>
                  {r.files.map((f, idx) => (
                    <li key={idx}>
                      <a href={f.url} target="_blank" rel="noreferrer">{f.filename}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Multi-Level Approvals */}
            {r.approvals && r.approvals.length > 0 && (
              <div style={{ marginTop: "10px", paddingLeft: "10px", borderLeft: "3px solid #999" }}>
                <strong>Approvals:</strong>
                {r.approvals.map((a, idx) => (
                  <div key={idx} style={{ marginBottom: "5px" }}>
                    <p>Level {a.level} - {a.status || "-"}</p>
                    <p>Approver: {a.approverId?.name || "-"} ({a.approverId?.email || "-"}) | Dept: {a.approverId?.department || "-"}</p>
                    <p>Action Date: {a.actionDate ? new Date(a.actionDate).toLocaleString() : "-"}</p>
                    <p>Remark: {a.remark || "-"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MyRequests;
