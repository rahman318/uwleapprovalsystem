import { useEffect, useState } from "react";

const TickerBar = () => {
  const [ticker, setTicker] = useState([]);

  const fetchTicker = async () => {
    try {
      const res = await fetch(
        "https://backenduwleapprovalsystem.onrender.com/api/ticker"
      );
      const data = await res.json();

      console.log("ticker data:", data);

      setTicker(data.data || data || []);
    } catch (err) {
      console.error("Ticker error:", err);
      setTicker([]);
    }
  };

  useEffect(() => {
    fetchTicker();
  }, []);

  if (!ticker.length) {
    return (
      <div className="w-full bg-slate-900 text-white py-2 text-center">
        No ticker available
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-slate-900 text-white py-2">
      <div className="ticker">
        {ticker.map((t) => (
          <span key={t._id}>
            {t.message} &nbsp;&nbsp;&nbsp;
          </span>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
