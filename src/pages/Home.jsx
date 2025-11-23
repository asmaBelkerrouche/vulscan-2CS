import React, { useEffect, useState } from "react";
import ScanButton from "../components/ScanButton";
import ScanResult from "../components/ScanResult";
import ScanHistory from "../components/ScanHistory";
import Vulnerabilities from "../components/Vulnerabilities";
import SecurityShield from "../components/ShieldIllustration";

export default function Home() {
  const [userName, setUserName] = useState("User");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const userData = localStorage.getItem("userData");
        const accessToken = localStorage.getItem("access_token");
        const refreshToken = localStorage.getItem("refresh_token");
        
        console.log("🔍 Checking authentication...");
        console.log("User data:", userData);
        console.log("All localStorage keys:", Object.keys(localStorage));
        
        if (userData) {
          const parsed = JSON.parse(userData);
          console.log("✅ Found user data:", parsed);
          setUserName(parsed.fullName || parsed.name || parsed.username || parsed.email || "User");
          setIsLoggedIn(true);
        } else if (accessToken || refreshToken) {
          console.log("✅ Found tokens, user is logged in");
          setUserName("User");
          setIsLoggedIn(true);
        } else {
          console.log("❌ No authentication data found in localStorage");
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsLoggedIn(false);
      }
    };

    checkAuthentication();
  }, []);
  
  const manualLoginTest = () => {
    localStorage.setItem("userData", JSON.stringify({
      fullName: "Test User",
      name: "Test User",
      email: "test@example.com"
    }));
    window.location.reload();
  };

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-[#0A1628] via-[#0D1B2A] to-[#1B263B] relative overflow-hidden">
      {/* === ANIMATED BACKGROUND EFFECTS === */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* === GRID PATTERN OVERLAY === */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(94, 234, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(94, 234, 212, 0.3) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>
      
      {/* === MAIN CONTENT === */}
      <div className="relative z-10 py-20">
        {/* Debug info and manual login test */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs z-50">
            <div>Status: {isLoggedIn ? "✅ LOGGED IN" : "❌ NOT LOGGED IN"}</div>
            <div>User: {userName}</div>
            <div>Storage: {localStorage.length} items</div>
            <button 
              onClick={manualLoginTest}
              className="mt-2 bg-green-500 hover:bg-green-600 px-2 py-1 rounded text-xs"
            >
              Test Login
            </button>
          </div>
        )}

        {/* Top: Scan Now Button + Shield */}
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-6 mb-20 gap-6 md:gap-8 lg:gap-10">
          {/* ScanButton */}
          <div className="relative flex flex-col items-center">
            {/* Connection lines coming from the left */}
            <div className="relative px-16 w-full flex justify-evenly">
              
              {/* ---- BUTTON ---- */}
              <ScanButton />
              {/* Starting dot (left side) */}
              <div className="absolute right-71 top-9 w-3 h-3 bg-white rounded-full"></div>
              
              {/* Horizontal line from left */}
              <div className="absolute right-67 top-10 -translate-y-1/5 -translate-x-4 w-[65px] h-[2px] bg-white"></div>
              
              {/* Horizontal line to button */}
              <div className="absolute right-71 top-128 w-[65px] h-[2px] bg-white"></div>
              
              {/* Dot before button */}
              <div className="absolute right-70 top-127 w-3 h-3 bg-white rounded-full"></div>
            </div>
            
            {/* ---- VERTICAL LINE FROM BUTTON TO SCAN RESULT ---- */}
            <div className="absolute right-87 top-10 w-[2px] h-[474px] bg-white rounded-full"></div>
          </div>
          
          {/* ---- SHIELD AREA WITH SECURITY SHIELD ---- */}
          <div className="relative right-48 w-48 h-48 md:w-52 md:h-52 lg:w-56 lg:h-56 flex items-center justify-center">
            {/* Rotating ring effect */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-spin" style={{ animationDuration: '8s' }}></div>
            <div className="absolute inset-4 rounded-full border-2 border-teal-400/20 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
            <SecurityShield />
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-40 px-6 relative flex flex-col items-center">
          <div className="bg-white/10 backdrop-blur-xl w-[1090px] rounded-2xl border border-white/10 shadow-lg p-8 transition hover:shadow-[0_0_25px_#3EA8FF50] relative z-10">
            <h3 className="text-white text-xl font-semibold mb-4">
              Scan Result Summary
            </h3>
            <ScanResult user={isLoggedIn} />
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 px-6 relative">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg p-6 hover:shadow-[0_0_25px_#3EA8FF50] transition relative z-10">
            <ScanHistory />
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg p-6 hover:shadow-[0_0_25px_#3EA8FF50] transition relative z-10">
            <Vulnerabilities user={isLoggedIn} />
          </div>
        </div>
      </div>
    </div>
  );
}