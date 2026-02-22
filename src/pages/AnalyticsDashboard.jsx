// AnalyticsDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const AnalyticsDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const token = localStorage.getItem("token");

  // ================== DIGITAL CLOCK ==================
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ================== FETCH REQUESTS ==================
  const fetchRequests = async () => {
    try {
      const res = await axios.get("https://backenduwleapprovalsystem.onrender.com/api/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const maintenanceRequests = res.data.filter(
        (r) => r.requestType === "Maintenance"
      );
      setRequests(maintenanceRequests);
    } catch (err) {
      console.error("❌ Fetch requests error:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================== OVERDUE CHECK ==================
  const checkOverdue = (assignedAt, slaHours, maintenanceStatus) => {
    if (!assignedAt || maintenanceStatus === "Completed") return false;
    const assignedTime = new Date(assignedAt);
    const diffHours = (currentTime - assignedTime) / (1000 * 60 * 60);
    return diffHours > slaHours;
  };

  // ================== CALCULATE KPI ==================
  const total = requests.length;
  const completed = requests.filter(r => r.maintenanceStatus === "Completed").length;
  const inProgress = requests.filter(r => r.maintenanceStatus === "In Progress").length;
  const overdue = requests.filter(r => checkOverdue(r.assignedAt, r.slaHours, r.maintenanceStatus)).length;

  // ================== CHART DATA ==================
  const chartData = [
    { name: "Completed", value: completed },
    { name: "In Progress", value: inProgress },
    { name: "Overdue", value: overdue },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">Analytics Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white shadow p-4 rounded">
            <h2 className="text-gray-500">Total Requests</h2>
            <p className="text-2xl font-bold text-blue-700">{total}</p>
          </div>
          <div className="bg-white shadow p-4 rounded">
            <h2 className="text-gray-500">Completed</h2>
            <p className="text-2xl font-bold text-green-600">{completed}</p>
          </div>
          <div className="bg-white shadow p-4 rounded">
            <h2 className="text-gray-500">In Progress</h2>
            <p className="text-2xl font-bold text-yellow-500">{inProgress}</p>
          </div>
          <div className="bg-white shadow p-4 rounded">
            <h2 className="text-gray-500">Overdue</h2>
            <p className="text-2xl font-bold text-red-600">{overdue}</p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-lg font-semibold mb-4">Maintenance Status Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
