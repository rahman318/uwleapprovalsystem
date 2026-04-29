import { useEffect, useState } from "react";

const TickerBar = () => {
  const [ticker, setTicker] = useState([]);
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");

  // ================= FETCH =================
  const fetchTicker = async () => {
    try {
      const res = await fetch(
        "https://backenduwleapprovalsystem.onrender.com/api/ticker"
      );
      const data = await res.json();

      setTicker(data.data || data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchTicker();
  }, []);

  // ================= ADD =================
  const handleAdd = async () => {
    if (!message.trim()) return alert("Enter message dulu bossskurrr");

    try {
      await fetch(
        "https://backenduwleapprovalsystem.onrender.com/api/ticker",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            priority,
          }),
        }
      );

      setMessage("");
      setPriority("normal");

      fetchTicker(); // refresh list
    } catch (err) {
      console.error("Add error:", err);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    await fetch(
      `https://backenduwleapprovalsystem.onrender.com/api/ticker/${id}`,
      {
        method: "DELETE",
      }
    );
    fetchTicker();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow mt-4">
      <h2 className="text-xl font-bold mb-4 text-blue-700">
         Ticker Management
      </h2>

      {/* ================= FORM ================= */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter ticker message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 border p-2 rounded-lg"
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="border p-2 rounded-lg"
        >
          <option value="normal">Normal</option>
          <option value="high">High 🚨</option>
        </select>

        <button
          onClick={handleAdd}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Add
        </button>
      </div>

      {/* ================= LIST ================= */}
      <div className="space-y-2">
        {ticker.length === 0 && (
          <p className="text-gray-500">No ticker yet</p>
        )}

        {ticker.map((t) => (
          <div
            key={t._id}
            className="flex justify-between items-center bg-gray-100 p-3 rounded-lg"
          >
            <span
              className={
                t.priority === "high"
                  ? "text-red-600 font-bold"
                  : "text-gray-800"
              }
            >
              {t.message}
            </span>

            <button
              onClick={() => handleDelete(t._id)}
              className="bg-red-500 text-white px-2 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
