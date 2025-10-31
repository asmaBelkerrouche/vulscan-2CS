"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function History() {
  const [historyItems, setHistoryItems] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // TODO: Replace with real fetch from backend / local storage
    const mock = [
      { id: 1, url: "https://example.com", date: "2025-10-01", vulnerabilities: 3 },
      { id: 2, url: "https://another-site.com", date: "2025-09-25", vulnerabilities: 0 },
      { id: 3, url: "https://website.org", date: "2025-09-10", vulnerabilities: 5 },
    ]
    setHistoryItems(mock)
  }, [])

  // Fake download function
  const handleDownload = (item) => {
    const reportContent = `
      Report for ${item.url}
      Date: ${item.date}
      Vulnerabilities: ${item.vulnerabilities}
    `
    const blob = new Blob([reportContent], { type: "text/plain" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `scan-report-${item.id}.txt` // for now TXT (could be PDF later)
    link.click()
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-[#F4F4F4] px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Scan History</h1>

        {historyItems.length === 0 ? (
          <div className="text-center text-gray-400 mt-16">
            <p>No scan history available.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#142D4C] border border-[#1F3B5A] rounded-2xl p-6 hover:bg-[#1A3C5E] transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-lg font-semibold">{item.url}</p>
                  <span className="text-sm text-gray-400">{item.date}</span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm text-gray-400">Vulnerabilities found:</span>
                  <span
                    className={`font-bold ${
                      item.vulnerabilities > 0 ? "text-[#34D399]" : "text-gray-300"
                    }`}
                  >
                    {item.vulnerabilities}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/history/${item.id}`)}
                    className="bg-[#34D399] text-[#0D1B2A] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#2ab57d] transition-colors"
                  >
                    Read Report
                  </button>
                  <button
                    onClick={() => handleDownload(item)}
                    className="bg-[#1F3B5A] text-[#F4F4F4] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#2d537e] transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
