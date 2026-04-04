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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data.requests || res.data || [];
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
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
    .filter((r) => !filter || r.status === filter);

  if (loading) return <p style={{ textAlign: "center", marginTop: "20px" }}>Loading My Requests...</p>;
  if (!requests.length) return <p style={{ textAlign: "center", marginTop: "20px" }}>No requests found.</p>;

  const statusColor = (status) =>
    status === "Pending" ? "orange" : status === "Approved" ? "green" : "red";

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>My Requests History</h2>

      {/* Search & Filter */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px", flex: "1 1 200px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Requests List */}
      {filteredRequests.map((r) => (
        <div
          key={r._id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "15px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>{r.title || "-"}</h3>

          <p>
            <strong>Status: </strong>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "5px",
                color: "#fff",
                fontWeight: "bold",
                backgroundColor: statusColor(r.status),
              }}
            >
              {r.status || "-"}
            </span>
          </p>
          <p>
            <strong>Request Type:</strong> {r.requestType || "-"}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
          </p>

          {/* Details */}
          {r.details && Object.keys(r.details).length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <strong>Details:</strong>
              <ul style={{ marginLeft: "15px" }}>
                {Object.entries(r.details).map(([key, val]) => (
                  <li key={key}>
                    {key}: {val || "-"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Items (for PEMBELIAN) */}
          {r.items && r.items.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <strong>Items:</strong>
              {r.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    borderRadius: "5px",
                    marginTop: "5px",
                    backgroundColor: "#fff",
                  }}
                >
                  <p><strong>Item {idx + 1}</strong></p>
                  {Object.entries(item).map(([key, val]) => (
                    <p key={key}>
                      {key}: {val || "-"}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Approvals */}
          {r.approvals && r.approvals.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <strong>Approvals:</strong>
              {r.approvals.map((a, idx) => (
                <div
                  key={idx}
                  style={{
                    borderLeft: "3px solid #888",
                    paddingLeft: "10px",
                    marginTop: "5px",
                  }}
                >
                  <p>
                    <strong>Level {a.level}</strong> - {a.status || "-"}
                  </p>
                  <p>
                    Approver: {a.approverId?.name || "-"} ({a.approverId?.email || "-"}) | Dept:{" "}
                    {a.approverId?.department || "-"}
                  </p>
                  <p>
                    Action Date: {a.actionDate ? new Date(a.actionDate).toLocaleString() : "-"}
                  </p>
                  <p>Remark: {a.remark || "-"}</p>
                </div>
              ))}
            </div>
          )}

          {/* Signature */}
          {r.signatureStaff && (
            <div style={{ marginTop: "10px" }}>
              <strong>Staff Signature:</strong>
              <div>
                <img
                  src={r.signatureStaff}
                  alt="signature"
                  style={{ border: "1px solid #ccc", borderRadius: "5px", maxWidth: "300px" }}
                />
              </div>
            </div>
          )}

          {/* Attached Files */}
          {r.files && r.files.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <strong>Files:</strong>
              <ul style={{ marginLeft: "15px" }}>
                {r.files.map((f, i) => (
                  <li key={i}>
                    <a href={f.url || "#"} target="_blank" rel="noopener noreferrer">
                      {f.name || "File"}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyRequests;
