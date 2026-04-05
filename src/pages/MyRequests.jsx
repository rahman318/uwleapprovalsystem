import React, { useEffect, useState } from "react";
import axios from "axios";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { useNavigate } from "react-router-dom"; // step 1 & 2

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [openAccordions, setOpenAccordions] = useState({});

  const token = localStorage.getItem("token");
  const navigate = useNavigate(); // step 2

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "https://backenduwleapprovalsystem.onrender.com/api/my-requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data.requests || res.data || [];
      console.log("Fetched Requests:", data); // <-- log fetched requests
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

  const toggleAccordion = (id) => {
    setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredRequests = requests
    .filter((r) => r.requestType?.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => !filter || r.finalStatus === filter);

  // ----------------- Step 3: Recall Function (Updated) -----------------
const handleRecall = async (id) => {
  try {
    console.log("Attempting Recall for Request ID:", id);
    console.log("Token:", token);

    // 1️⃣ Fetch latest request status from server
    const resCheck = await axios.get(
      `https://backenduwleapprovalsystem.onrender.com/api/requests/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const latestStatus = resCheck.data.finalStatus;
    console.log("Latest Status from Server:", latestStatus);

    if (latestStatus !== "Pending") {
      alert(`Request tidak boleh direcall. Status terkini: ${latestStatus}`);
      return; // stop recall
    }

    // 2️⃣ Jika status memang pending, baru buat recall
    const res = await axios.put(
      `https://backenduwleapprovalsystem.onrender.com/api/requests/${id}/recall`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("Recall Success:", res.data);
    alert("Request berjaya direcall!");

    fetchRequests(); // reload list supaya frontend update status
  } catch (err) {
    console.log("Full Error Response:", err.response);
    alert(err.response?.data?.message || "Gagal recall request");
  }
};

  // ----------------- Step 4: Edit Function -----------------
  const handleEdit = (request) => {
    navigate("/edit-request", { state: request });
  };

  const generatePDF = async (request) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let y = height - 50;

    const drawText = (text, size = 12) => {
      page.drawText(text, { x: 50, y, size, font, color: rgb(0, 0, 0) });
      y -= size + 8;
    };

    drawText(`Request Type: ${request.requestType}`, 16);
    drawText(`Staff: ${request.staffName}`);
    drawText(`Department: ${request.staffDepartment}`);
    drawText(`Final Status: ${request.finalStatus}`);
    drawText(`Created At: ${new Date(request.createdAt).toLocaleString()}`);
    if (request.problemDescription) drawText(`Problem: ${request.problemDescription}`);

    if (request.items && request.items.length > 0) {
      drawText("Items:", 14);
      request.items.forEach((i, idx) => {
        drawText(`${idx + 1}. ${i.itemName} | Qty: ${i.quantity} | Cost: ${i.estimatedCost}`);
      });
    }

    if (request.approvals && request.approvals.length > 0) {
      drawText("Approvals:", 14);
      request.approvals.forEach((a, idx) => {
        drawText(
          `Level ${a.level} - ${a.status} | Approver: ${a.approverName || "-"} | Dept: ${
            a.approverDepartment || "-"
          }`
        );
        if (a.remark) drawText(`Remark: ${a.remark}`);
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${request.requestType}_${request.staffName}.pdf`;
    link.click();
  };

  if (loading) return <p>Loading Requests History...</p>;
  if (!requests.length) return <p>No requests found.</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: "0 0 10px 0", fontSize: "28px", color: "#333" }}>Requests History</h2>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <input
            type="text"
            placeholder="Search by type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "20px",
              border: "1px solid #ccc",
              minWidth: "200px",
              outline: "none",
            }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "20px",
              border: "1px solid #ccc",
              outline: "none",
            }}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Recalled">Recalled</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.map((r) => (
        <div
          key={r._id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "10px",
            backgroundColor: "#f9f9f9",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            onClick={() => toggleAccordion(r._id)}
          >
            <h3 style={{ margin: 0 }}>
              {r.requestType} - {r.staffName}
            </h3>
            <span style={{ fontSize: "20px", color: "#666" }}>{openAccordions[r._id] ? "−" : "+"}</span>
          </div>

          <p style={{ margin: "5px 0" }}>
            Final Status:{" "}
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "5px",
                color: "#fff",
                fontWeight: "bold",
                backgroundColor:
                  r.finalStatus === "Pending"
                    ? "orange"
                    : r.finalStatus === "Recalled"
                    ? "blue"
                    : r.finalStatus === "Approved"
                    ? "green"
                    : "red",
              }}
            >
              {r.finalStatus || "-"}
            </span>
          </p>
          <p style={{ margin: "5px 0", color: "#555" }}>
            Created At: {new Date(r.createdAt).toLocaleString()}
          </p>

          {/* Collapsible content */}
          <div
            style={{
              maxHeight: openAccordions[r._id] ? "1000px" : "0",
              overflow: "hidden",
              transition: "max-height 0.4s ease",
            }}
          >
            {r.problemDescription && <p>Problem: {r.problemDescription}</p>}

            {r.items && r.items.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <strong>Items:</strong>
                <ul>
                  {r.items.map((i, idx) => (
                    <li key={idx}>
                      {i.itemName} | Qty: {i.quantity} | Cost: {i.estimatedCost}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {r.approvals && r.approvals.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <strong>Approvals:</strong>
                {r.approvals.map((a, idx) => (
                  <div key={idx} style={{ marginLeft: "10px", marginTop: "5px" }}>
                    <p>
                      Level {a.level} - {a.status}
                    </p>
                    <p>
                      Approver: {a.approverName || "-"} | Dept: {a.approverDepartment || "-"}
                    </p>
                    <p>Remark: {a.remark || "-"}</p>
                    <p>Action Date: {a.actionDate ? new Date(a.actionDate).toLocaleString() : "-"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ----------------- Step 5: Buttons ----------------- */}
          <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {/* Export PDF */}
            <button
              onClick={() => generatePDF(r)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#0056b3")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#007bff")}
            >
              Export to PDF
            </button>

            {/* Recall Button */}
            {r.finalStatus === "Pending" && (
              <button
                onClick={() => handleRecall(r._id, r.finalStatus)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  backgroundColor: "orange",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Recall
              </button>
            )}

            {/* Edit Button */}
            {r.finalStatus === "Recalled" && (
              <button
                onClick={() => handleEdit(r)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  backgroundColor: "blue",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyRequests;
