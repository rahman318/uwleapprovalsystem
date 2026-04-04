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

  const getRequestStatus = (r) => {
    if (r.finalStatus) return r.finalStatus;
    if (r.approvals && r.approvals.length) {
      return r.approvals[r.approvals.length - 1].status || "Pending";
    }
    return "Pending";
  };

  const statusColor = (status) => {
    if (status === "Pending") return "orange";
    if (status === "Approved") return "green";
    if (status === "Rejected") return "red";
    return "gray";
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
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>My Requests History</h2>

      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Search by staff or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "5px", marginRight: "10px" }}
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

      {filteredRequests.map((r) => (
        <div
          key={r._id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "10px",
          }}
        >
          <h3>
            {r.requestType} - {r.staffName}
          </h3>
          <p>
            Status:{" "}
            <span
              style={{
                padding: "3px 8px",
                borderRadius: "5px",
                color: "#fff",
                fontWeight: "bold",
                backgroundColor: statusColor(getRequestStatus(r)),
              }}
            >
              {getRequestStatus(r)}
            </span>
          </p>
          <p>Created At: {new Date(r.createdAt).toLocaleString()}</p>
          {r.requestType === "CUTI" && r.leaveStart && (
            <p>
              Leave: {new Date(r.leaveStart).toLocaleDateString()} -{" "}
              {new Date(r.leaveEnd).toLocaleDateString()}
            </p>
          )}
          {r.problemDescription && <p>Problem: {r.problemDescription}</p>}

          {r.items && r.items.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <strong>Items:</strong>
              {r.items.map((item, idx) => (
                <div key={idx} style={{ paddingLeft: "10px" }}>
                  <p>
                    {item.itemName} - Qty: {item.quantity} - Cost:{" "}
                    {item.estimatedCost} - Supplier: {item.supplier}
                  </p>
                  <p>Reason: {item.reason}</p>
                </div>
              ))}
            </div>
          )}

          {r.attachments && r.attachments.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <strong>Attachments:</strong>
              {r.attachments.map((a, idx) => (
                <p key={idx}>
                  <a href={a.url} target="_blank" rel="noopener noreferrer">
                    {a.originalName}
                  </a>
                </p>
              ))}
            </div>
          )}

          {r.approvals && r.approvals.length > 0 && (
            <div
              style={{
                marginLeft: "15px",
                paddingLeft: "10px",
                borderLeft: "2px solid #999",
                marginTop: "10px",
              }}
            >
              <strong>Approval History:</strong>
              {r.approvals.map((a, idx) => {
                const name = a.approverName || "-";
                const dept = a.approverDepartment || "-";
                const actionDate = a.actionDate
                  ? new Date(a.actionDate).toLocaleString()
                  : "-";
                return (
                  <div key={idx} style={{ marginBottom: "5px" }}>
                    <p>
                      Level {a.level} - {a.status}
                    </p>
                    <p>
                      Approver: {name} | Dept: {dept}
                    </p>
                    <p>Action Date: {actionDate}</p>
                    <p>Remark: {a.remark || "-"}</p>
                  </div>
                );
              })}
            </div>
          )}

          {r.technicianRemark && (
            <p>
              <strong>Technician Remark:</strong> {r.technicianRemark}
            </p>
          )}

          {r.proofImageUrl && (
            <p>
              <strong>Proof Image:</strong>{" "}
              <a href={r.proofImageUrl} target="_blank" rel="noopener noreferrer">
                View
              </a>
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyRequests;
