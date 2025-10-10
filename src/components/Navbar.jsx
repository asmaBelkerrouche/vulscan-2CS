import { Link } from "react-router-dom";
import React from "react";

export default function Navbar({ active, userName = "User" }) {
  return (
    <nav className="bg-[#0D1B2A] border-b border-[#1F3B5A] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg
              className="h-7 w-7 text-[#34D399]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-xl font-bold text-[#F4F4F4]">VulnScan</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/home"
              className={`hover:text-[#34D399] ${
                active === "home"
                  ? "text-[#34D399] font-semibold"
                  : "text-[#F4F4F4]"
              }`}
            >
              Home
            </Link>
            <Link
              to="/scan"
              className={`hover:text-[#34D399] ${
                active === "scan"
                  ? "text-[#34D399] font-semibold"
                  : "text-[#F4F4F4]"
              }`}
            >
              Scan
            </Link>
            <Link
              to="/history"
              className={`hover:text-[#34D399] ${
                active === "history"
                  ? "text-[#34D399] font-semibold"
                  : "text-[#F4F4F4]"
              }`}
            >
              History
            </Link>
            <Link
              to="/about"
              className={`hover:text-[#34D399] ${
                active === "about"
                  ? "text-[#34D399] font-semibold"
                  : "text-[#F4F4F4]"
              }`}
            >
              About Us
            </Link>
            <Link
              to="/profile"
              className={`hover:text-[#34D399] ${
                active === "profile"
                  ? "text-[#34D399] font-semibold"
                  : "text-[#F4F4F4]"
              }`}
            >
              Profile
            </Link>
          </div>

          {/* User Button */}
          <button
            className="ml-4 bg-[#34D399] text-[#0D1B2A] px-4 py-2 rounded-lg font-semibold 
              hover:bg-[#2ab57d] transition-colors shadow-md text-sm"
          >
            {userName}
          </button>
        </div>
      </div>
    </nav>
  );
}

