import React, { useEffect, useState } from "react";
import ScanButton from "../components/ScanButton";
import ScanResult from "../components/ScanResult";
import ScanHistory from "../components/ScanHistory";
import Vulnerabilities from "../components/Vulnerabilities";

export default function Home() {
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUserName(parsed.fullName || parsed.name || "User");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1C2C] to-[#081522] text-white py-10">
      {/* Top: Scan Button + Shield */}
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6">
        <ScanButton />
        <div className="w-40 h-40">
          {/* Shield Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 64 64"
            stroke="#3EA8FF"
            strokeWidth="2"
          >
            <path
              d="M32 2L10 12v18c0 13.25 8 23 22 26 14-3 22-12.75 22-26V12L32 2z"
              fill="#3EA8FF"
              fillOpacity="0.15"
            />
            <circle cx="32" cy="30" r="8" stroke="#3EA8FF" strokeWidth="3" />
            <line
              x1="38"
              y1="36"
              x2="46"
              y2="44"
              stroke="#3EA8FF"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Scan Result Summary */}
      <div className="max-w-6xl mx-auto mt-14 px-6">
        <ScanResult />
      </div>

      {/* Scan History & Vulnerabilities */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 px-6">
        <ScanHistory />
        <Vulnerabilities />
      </div>
    </div>
  );
}
