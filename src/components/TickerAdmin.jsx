import { useEffect, useState } from "react";

const TickerBar = () => {
  const [ticker, setTicker] = useState([]);

  const fetchTicker = async () => {
    const res = await fetch("https://backenduwleapprovalsystem.onrender.com/api/ticker");
    const data = await res.json();
    setTicker(data);
  };

  useEffect(() => {
    fetchTicker();
  }, []);

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
