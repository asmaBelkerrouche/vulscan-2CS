"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function AboutUs() {
  // -------------------------------
  // State for storing user's name
  // -------------------------------
  const [userName, setUserName] = useState("UserName");

  // -------------------------------
  // On mount, check localStorage for user data
  // -------------------------------
  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsedData = JSON.parse(userData);
      setUserName(parsedData.fullName || parsedData.name || "UserName");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-[#F4F4F4]">

      {/* ===============================
          HERO SECTION
          =============================== */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* --------------------------
                Left: Title, description, CTA button
                -------------------------- */}
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Simple Vulnerability Scanning for Beginners
              </h1>
              <p className="text-[#F4F4F4]/70 text-lg mb-8">
                Easily scan websites and applications for common security flaws.
              </p>
              <Link
                to="/scan"
                className="inline-block bg-[#34D399] text-[#0D1B2A] px-8 py-3 rounded-lg font-semibold hover:bg-[#2ab57d] transition-colors shadow-lg shadow-[#34D399]/20"
              >
                Start Scanning
              </Link>
            </div>

            {/* --------------------------
                Right: Illustration + animated particles
                -------------------------- */}
            <div className="relative w-full max-w-md mx-auto">
              <svg viewBox="0 0 400 300" className="w-full">
                <rect x="50" y="20" width="300" height="200" rx="8" fill="#142D4C" stroke="#34D399" strokeWidth="3" />
                <circle cx="200" cy="100" r="40" fill="none" stroke="#34D399" strokeWidth="4" opacity="0.8" />
                <line x1="230" y1="130" x2="260" y2="160" stroke="#34D399" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                <circle cx="200" cy="100" r="25" fill="none" stroke="#34D399" strokeWidth="2" opacity="0.5" />
                <path d="M30 220 L50 220 L50 225 L350 225 L350 220 L370 220 L380 240 L20 240 Z" fill="#1F3B5A" stroke="#34D399" strokeWidth="2" />
              </svg>

              {/* Small animated particle effects */}
              <div className="absolute top-10 right-10 w-2 h-2 bg-[#34D399] rounded-full animate-pulse" />
              <div className="absolute top-32 right-5 w-1.5 h-1.5 bg-[#34D399] rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
              <div className="absolute bottom-20 left-10 w-2 h-2 bg-[#34D399] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ===============================
          HOW IT WORKS SECTION
          =============================== */}
      <section className="bg-[#F4F4F4] text-[#0D1B2A] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Enter URL",
                desc: "Input the website or application URL you want to scan.",
                icon: <circle cx="12" cy="12" r="10" />,
              },
              {
                title: "Run Scan",
                desc: "Our system checks for common vulnerabilities.",
                icon: (
                  <>
                    <path d="M21 12a9 9 0 1 1-9-9" />
                    <path d="M21 3v5h-5" />
                  </>
                ),
              },
              {
                title: "View Report",
                desc: "Get a report with findings and recommendations.",
                icon: (
                  <>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </>
                ),
              },
            ].map((step, i) => (
              <div key={i} className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-[#142D4C] rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-[#34D399]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    {step.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-[#0D1B2A]/70">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===============================
          WHY CHOOSE US SECTION
          =============================== */}
      <section className="bg-[#142D4C] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">Why Choose Us</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Easy to Understand Reports",
                desc: "Clear explanations and actionable recommendations.",
              },
              {
                title: "Common Vulnerabilities (SQL, XSS, etc.)",
                desc: "Detect SQL injection, XSS, CSRF, and more.",
              },
              {
                title: "Learning Resources",
                desc: "Get guides to understand and fix security issues.",
              },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <svg className="w-12 h-12 text-[#34D399]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-[#F4F4F4]/70">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===============================
          CONTACT SECTION
          =============================== */}
      <section className="bg-[#0D1B2A] py-20 px-4 border-t border-[#1F3B5A]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Get In Touch</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "Email",
                content: "support@vulnscan.com",
                icon: <rect x="2" y="4" width="20" height="16" rx="2" />,
              },
              {
                title: "Phone",
                content: "+1 (234) 567-890",
                icon: (
                  <path d="M22 16.92v3a2 2 0 01-2.18 2A19.91 19.91 0 013.09 5.18 2 2 0 015 3h3a2 2 0 012 1.72 13 13 0 00.56 2.83 2 2 0 01-.45 2.11L9 11a16 16 0 006 6l1.34-1.11a2 2 0 012.11-.45 13 13 0 002.83.56A2 2 0 0122 16.92z" />
                ),
              },
              {
                title: "Location",
                content: "San Francisco, CA",
                icon: (
                  <>
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="bg-[#142D4C] p-6 rounded-lg text-center hover:bg-[#1F3B5A] transition-colors">
                <svg className="w-12 h-12 text-[#34D399] mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                {item.title === "Email" ? (
                  <a href={`mailto:${item.content}`} className="text-[#34D399] hover:underline">{item.content}</a>
                ) : item.title === "Phone" ? (
                  <a href={`tel:${item.content}`} className="text-[#34D399] hover:underline">{item.content}</a>
                ) : (
                  <p className="text-[#34D399]">{item.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
