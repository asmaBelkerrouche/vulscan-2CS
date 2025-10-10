import React from 'react'

// components/Footer.jsx
export default function Footer() {
  return (
    <footer className="border-t border-[#1F3B5A] bg-[#142D4C] mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>© 2025 VulnScan</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-[#F4F4F4] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-[#F4F4F4] transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
