import React from "react";
import { Navigate, Outlet, Route } from "react-router-dom";

export default function ProtectedRoute() {
  // ✅ Replace this with your actual authentication check
  const isAuthenticated = localStorage.getItem("authToken"); // or your own logic

  return isAuthenticated ? <Route /> : <Navigate to="/login" replace />;
}
