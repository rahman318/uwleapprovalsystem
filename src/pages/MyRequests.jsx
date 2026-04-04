import React, { useEffect, useState } from "react";
import axios from "axios"; // lebih selamat & mudah handle headers

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
        "https://backenduwleapprovalsystem.onrender.com/api/job-orders/myrequests", // pastikan endpoint betul
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Jika backend return object { success: true, requests: [...] }
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
    .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => !filter || r.status === filter);

  if (loading) return <p>Loading My Requests...</p>;
  if (!requests.length) return <p>No requests found.</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>My Requests History</h2>

      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Search by title..."
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
          <h3>{r.title}</h3>
          <p>
            Status:{" "}
            <span
              style={{
                padding: "3px 8px",
                borderRadius: "5px",
                color: "#fff",
                fontWeight: "bold",
                backgroundColor:
                  r.status === "Pending"
                    ? "orange"
                    : r.status === "Approved"
                    ? "green"
                    : "red",
              }}
            >
              {r.status}
            </span>
          </p>
          <p>Created At: {new Date(r.createdAt).toLocaleString()}</p>

          {r.approvals && r.approvals.length > 0 && (
            <div
              style={{
                marginLeft: "15px",
                paddingLeft: "10px",
                borderLeft: "2px solid #999",
                marginTop: "5px",
              }}
            >
              {r.approvals.map((a, idx) => {
                const name = a.approverId?.name || "-";
                const email = a.approverId?.email || "-";
                const dept = a.approverId?.department || "-";
                const actionDate = a.actionDate
                  ? new Date(a.actionDate).toLocaleString()
                  : "-";

                return (
                  <div key={idx} style={{ marginBottom: "5px" }}>
                    <p>
                      Level {a.level} - {a.status}
                    </p>
                    <p>
                      Approver: {name} ({email}) | Dept: {dept}
                    </p>
                    <p>Action Date: {actionDate}</p>
                    <p>Remark: {a.remark || "-"}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyRequests;
