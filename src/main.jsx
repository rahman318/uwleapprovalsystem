import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// ===================== REGISTER SERVICE WORKER =====================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then((reg) => {
      console.log("✅ Service Worker registered", reg);

      // Tunggu SW fully ready
      return navigator.serviceWorker.ready;
    })
    .then((reg) => {
      console.log("✅ Service Worker ready", reg);
    })
    .catch((err) => console.error("❌ SW registration failed", err));
}

// ===================== RENDER APP =====================
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
