import { Link, useLocation } from "react-router-dom";
import React from "react";

export default function Navbar({ userName = "Student ID" }) {
  const location = useLocation();

  // Determine which page is active based on the current path
  const currentPath = location.pathname;

  const getLinkClass = (path) =>
    `text-sm font-medium pb-4 pt-4 border-b-2 transition-colors ${
      currentPath === path
        ? "text-[#34D399] border-[#34D399]"
        : "text-gray-400 border-transparent hover:text-white hover:border-gray-600"
    }`;

  return (
    <nav className="bg-[#1B3A52] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Left Section — Logo */}
          <div className="flex items-center">
            <svg
              className="h-7 w-7 text-[#34D399]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-xl font-bold text-[#F4F4F4] ml-2">VulnScan</span>
          </div>

          {/* Middle Section — Navigation Links */}
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

          {/* Right Section — User Info */}
          <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700">
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
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
            <span className="text-sm text-slate-300">{userName}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
