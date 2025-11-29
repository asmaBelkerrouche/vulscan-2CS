import { Link, useLocation } from "react-router-dom";
import React from "react";

// Navbar component with an optional userName prop
export default function Navbar({ userName = "Student ID" }) {
  // Get current route path
  const location = useLocation();
  const currentPath = location.pathname;

  // Function that returns dynamic styles based on the active link
  const getLinkClass = (path) =>
    `text-sm font-medium pb-4 pt-4 border-b-2 transition-all duration-300 ${
      currentPath === path
        ? "text-[#34D399] border-[#34D399]" // Active link styling (green highlight)
        : "text-gray-400 border-transparent hover:text-white hover:border-gray-600" // Inactive link styling
    }`;

  return (
    // Navbar container (sticky at the top with shadow)
    <nav className="bg-[#1B3A52] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          
          {/* -------------------------------------- */}
          {/* LEFT SECTION — Logo + App Name         */}
          {/* -------------------------------------- */}
          <div className="flex items-center">
            {/* Shield logo icon */}
            <svg
              className="h-7 w-7 text-[#34D399]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>

            {/* App title */}
            <span className="text-xl font-bold text-[#F4F4F4] ml-2">
              VulnScan
            </span>
          </div>

          {/* ------------------------------------------------ */}
          {/* MIDDLE SECTION — Navigation Links (Centered)     */}
          {/* ------------------------------------------------ */}
          <div className="flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            <Link to="/home" className={getLinkClass("/home")}>
              Home
            </Link>

            <Link to="/scan" className={getLinkClass("/scan")}>
              Scan
            </Link>

            <Link to="/history" className={getLinkClass("/history")}>
              History
            </Link>

            <Link to="/about" className={getLinkClass("/about")}>
              About Us
            </Link>

            <Link to="/profile" className={getLinkClass("/profile")}>
              Profile
            </Link>
          </div>

          {/* -------------------------------------------- */}
          {/* RIGHT SECTION — User Avatar + Username       */}
          {/* -------------------------------------------- */}
          <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700 transition-transform transform hover:scale-105 hover:shadow-lg duration-300">
            
            {/* Pulsing avatar placeholder */}
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center animate-pulse">
              <svg
                className="w-5 h-5 text-slate-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {/* Username linking to Profile page */}
            <Link
              to="/profile"
              className="text-sm text-slate-300 hover:text-[#34D399] hover:underline transition-colors duration-300 font-medium"
            >
              {userName}
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}
