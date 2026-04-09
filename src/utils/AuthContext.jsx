// src/utils/AuthContext.jsx
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const tokenStr = localStorage.getItem("token");
    setUser(userStr ? JSON.parse(userStr) : null);
    setToken(tokenStr || null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};