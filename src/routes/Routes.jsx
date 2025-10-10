import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import NewScanPage from "../pages/NewScanPage";
import History from "../pages/History";
import AboutUs from "../pages/AboutUs";
import Profile from "../pages/Profile";
import LoginSignup from "../pages/LoginSignup";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginSignup />} />

      {/* Direct access to pages */}
      <Route path="/home" element={<Home />} />
      <Route path="/" element={<NewScanPage />} />
      <Route path="/scan" element={<NewScanPage />} />
      <Route path="/history" element={<History />} />
      <Route path="/about" element={<AboutUs/>} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

