import React, { useEffect, useState } from "react";
import axios from "axios";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

  const filteredRequests = requests.filter((r) =>
    r.requestType?.toLowerCase().includes(search.toLowerCase())
  ).filter((r) => !filter || r.finalStatus === filter);

  const generatePDF = async (request) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let y = height - 50;

    const drawText = (text, size = 12) => {
      page.drawText(text, { x: 50, y, size, font, color: rgb(0,0,0) });
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
          `Level ${a.level} - ${a.status} | Approver: ${a.approverName || "-"} | Dept: ${a.approverDepartment || "-"}`
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

  if (loading) return <p>Loading My Requests...</p>;
  if (!requests.length) return <p>No requests found.</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>My Requests History</h2>

      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Search by type..."
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
            backgroundColor: "#f9f9f9",
          }}
        >
          <h3>{r.requestType} - {r.staffName}</h3>
          <p>
            Final Status:{" "}
            <span
              style={{
                padding: "3px 8px",
                borderRadius: "5px",
                color: "#fff",
                fontWeight: "bold",
                backgroundColor:
                  r.finalStatus === "Pending"
                    ? "orange"
                    : r.finalStatus === "Approved"
                    ? "green"
                    : "red",
              }}
            >
              {r.finalStatus || "-"}
            </span>
          </p>
          <p>Created At: {new Date(r.createdAt).toLocaleString()}</p>
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

          <div style={{ marginTop: "10px" }}>
            <button
              onClick={() => generatePDF(r)}
              style={{
                padding: "5px 10px",
                borderRadius: "5px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Export to PDF
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyRequests;
