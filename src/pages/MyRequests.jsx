import React, { useEffect, useState } from "react";
import axios from "axios";

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState([]);

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

  const getRequestStatus = (r) => r.finalStatus || "Pending";

  const statusColor = (status) =>
    status === "Pending" ? "#FFA500" : status === "Approved" ? "#28a745" : "#dc3545";

  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredRequests = requests
    .filter((r) =>
      r.staffName?.toLowerCase().includes(search.toLowerCase()) ||
      r.requestType?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((r) => !filter || getRequestStatus(r) === filter);

  if (loading) return <p>Loading My Requests...</p>;
  if (!requests.length) return <p>No requests found.</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>My Requests History</h2>

      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <input
          type="text"
          placeholder="Search by staff or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px", marginRight: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
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

      {filteredRequests.map((r) => {
        const isExpanded = expandedIds.includes(r._id);
        return (
          <div
            key={r._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px 20px",
              marginBottom: "15px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              transition: "all 0.3s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => toggleExpand(r._id)}>
              <h3 style={{ margin: 0 }}>{r.requestType} - {r.staffName}</h3>
              <span
                style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  color: "#fff",
                  backgroundColor: statusColor(getRequestStatus(r)),
                }}
              >
                {getRequestStatus(r)}
              </span>
            </div>

            {isExpanded && (
              <div style={{ marginTop: "15px", lineHeight: "1.5" }}>
                <p><strong>Created At:</strong> {new Date(r.createdAt).toLocaleString()}</p>
                {r.problemDescription && <p><strong>Problem:</strong> {r.problemDescription}</p>}
                {r.leaveStart && r.leaveEnd && <p><strong>Leave:</strong> {new Date(r.leaveStart).toLocaleDateString()} - {new Date(r.leaveEnd).toLocaleDateString()}</p>}

                {r.items && r.items.length > 0 && (
                  <div>
                    <strong>Items:</strong>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "5px" }}>
                      <thead>
                        <tr>
                          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Item</th>
                          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Qty</th>
                          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Cost</th>
                          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Supplier</th>
                          <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.itemName}</td>
                            <td>{item.quantity}</td>
                            <td>{item.estimatedCost}</td>
                            <td>{item.supplier}</td>
                            <td>{item.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {r.attachments && r.attachments.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <strong>Attachments:</strong>
                    <ul>
                      {r.attachments.map((a, idx) => (
                        <li key={idx}>
                          <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: "#007bff", textDecoration: "underline" }}>
                            {a.originalName}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {r.approvals && r.approvals.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <strong>Approval History:</strong>
                    {r.approvals.map((a, idx) => (
                      <div key={idx} style={{ paddingLeft: "10px", borderLeft: "2px solid #999", marginTop: "5px" }}>
                        <p style={{ margin: "2px 0" }}><strong>Level {a.level}:</strong> {a.status}</p>
                        <p style={{ margin: "2px 0" }}>Approver: {a.approverName || "-"} | Dept: {a.approverDepartment || "-"}</p>
                        <p style={{ margin: "2px 0" }}>Action Date: {a.actionDate ? new Date(a.actionDate).toLocaleString() : "-"}</p>
                        <p style={{ margin: "2px 0" }}>Remark: {a.remark || "-"}</p>
                      </div>
                    ))}
                  </div>
                )}

                {r.technicianRemark && <p><strong>Technician Remark:</strong> {r.technicianRemark}</p>}
                {r.proofImageUrl && <p><strong>Proof Image:</strong> <a href={r.proofImageUrl} target="_blank" rel="noopener noreferrer">View</a></p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MyRequests;
