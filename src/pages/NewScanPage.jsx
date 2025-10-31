"use client"

import { useState, useEffect } from "react"

export default function NewScanPage() {
  const [scanType, setScanType] = useState("quick")
  const [url, setUrl] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(30)
  const [error, setError] = useState("")
  const [userName, setUserName] = useState("UserName")
  const [scanComplete, setScanComplete] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("userData")
    if (userData) {
      const parsedData = JSON.parse(userData)
      setUserName(parsedData.fullName || parsedData.name || "UserName")
    }
  }, [])

  useEffect(() => {
    if (isScanning) {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 1
          if (newProgress >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return newProgress
        })
      }, 300)

      const timeInterval = setInterval(() => {
        setEstimatedTime((prev) => {
          if (prev <= 0) {
            clearInterval(timeInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        clearInterval(progressInterval)
        clearInterval(timeInterval)
      }
    }
  }, [isScanning])

  useEffect(() => {
    if (progress >= 100 && isScanning) {
      console.log("[v0] Scan complete! Setting scanComplete to true")
      setIsScanning(false)
      setScanComplete(true)
    }
  }, [progress, isScanning])

  const handleStartScan = () => {
    if (!url.trim()) {
      setError("Please enter a valid URL or IP address")
      return
    }
    setError("")
    setIsScanning(true)
    setProgress(0)
    setEstimatedTime(30)
  }

  const handleCancelScan = () => {
    setIsScanning(false)
    setProgress(0)
    setEstimatedTime(30)
  }

  const handleScanAgain = () => {
    setScanComplete(false)
    setIsScanning(false)
    setProgress(0)
    setEstimatedTime(30)
    setUrl("")
    setError("")
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins} minute${mins !== 1 ? "s" : ""} ${secs} second${secs !== 1 ? "s" : ""}`
  }

  if (scanComplete) {
    console.log("[v0] Rendering success screen")
    return (
      <div className="bg-[#0D1B2A] min-h-screen">
        <div className="text-[#F4F4F4]">
          {/* Success Screen */}
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              {/* Shield Icon */}
              <div className="relative mb-8">
                <div className="flex items-center justify-center h-32 w-32 rounded-full bg-[#34D399]/10 ring-4 ring-[#34D399]/30">
                  <svg
                    className="h-20 w-20 text-[#34D399]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
              </div>

              {/* Success Banner */}
              <div className="relative mb-8 bg-[#34D399] rounded-xl px-12 py-6 shadow-lg shadow-[#34D399]/30">
                <div className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-lg">
                  <svg
                    className="h-6 w-6 text-[#34D399]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white text-center">Scan Completed Successfully!</h1>
              </div>

              {/* View Scan Report Button */}
              <button className="mb-8 rounded-lg bg-red-500 px-8 py-3 font-semibold text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/30">
                View Scan Report
              </button>

              {/* Scan Details */}
              <div className="text-center text-gray-400 mb-4">
                <p className="font-medium">VulnerabilityAlert Found: 3</p>
                <p className="text-sm">8 minutes 17 seconds</p>
              </div>

              <button
                onClick={handleScanAgain}
                className="mt-4 rounded-lg border border-[#34D399] px-6 py-2 text-sm font-medium text-[#34D399] hover:bg-[#34D399]/10 transition-all"
              >
                Scan Again
              </button>
            </div>
          </div>

          {/* Recent Scans Section */}
          <div className="mx-auto max-w-7xl px-6 pb-16">
            <h2 className="text-2xl font-bold mb-6">Recent Scans</h2>
            <div className="rounded-2xl bg-[#142D4C] border border-[#1F3B5A] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-1">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#34D399]/20 ring-4 ring-[#34D399]/30">
                    <svg
                      className="h-6 w-6 text-[#34D399]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <span className="font-medium">Bloggersite.net</span>
                </div>
                <div className="flex items-center gap-6 flex-1">
                  <span className="text-gray-400">2023-10-29</span>
                </div>
                <div className="flex items-center gap-6 flex-1 justify-end">
                  <span className="text-gray-400">Completed</span>
                  <button className="rounded-lg border border-[#1F3B5A] px-6 py-2 text-sm font-medium hover:bg-[#34D399]/10 hover:border-[#34D399] transition-all">
                    View Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#0D1B2A] min-h-screen">
      <div className="text-[#F4F4F4]">
        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-center justify-between gap-12">
            {isScanning ? (
              <>
                {/* Scanning Animation - LEFT SIDE */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-56 h-56 rounded-full border-[3px] border-[#34D399]/40 animate-ping"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-44 h-44 rounded-full border-[3px] border-[#34D399]/30 animate-pulse"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full border-[3px] border-[#34D399]/20 animate-bounce"></div>
                    </div>

                    <div className="relative flex items-center justify-center w-40 h-40 rounded-full bg-[#34D399]/5 border-[3px] border-[#34D399]">
                      <svg
                        className="absolute h-24 w-24 text-[#34D399]"
                        viewBox="0 0 100 100"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      >
                        <path d="M 20 35 L 20 20 L 35 20" />
                        <path d="M 65 20 L 80 20 L 80 35" />
                        <path d="M 20 65 L 20 80 L 35 80" />
                        <path d="M 65 80 L 80 80 L 80 65" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Scanning Text - RIGHT SIDE */}
                <div className="flex-1">
                  <h1 className="text-5xl font-bold mb-4">Scanning in progress...</h1>
                  <p className="text-gray-400 text-lg mb-8">Uncover key Scan and inspections flaws.</p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#F4F4F4] font-medium">{progress}% Complete</span>
                    </div>
                    <div className="w-full bg-[#1F3B5A] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#34D399] h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-400 text-sm">Estimated time remaining: {formatTime(estimatedTime)}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <h1 className="text-5xl font-bold mb-4">New Scan</h1>
                  <p className="text-gray-400 text-lg">Easily scan websites and applications for common flaws.</p>
                </div>

                {/* Right Side PC with bubbles */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className="absolute w-48 h-32 border-4 border-[#34D399] rounded-lg shadow-[0_0_25px_#34D399] bg-[#0B1C2C] flex items-center justify-center"></div>
                  <div className="absolute bottom-6 w-56 h-3 bg-[#34D399] rounded-md shadow-[0_0_15px_#34D399]"></div>

                  <div className="absolute w-4 h-4 bg-[#34D399] rounded-full opacity-70 animate-bounce top-6 left-6"></div>
                  <div className="absolute w-6 h-6 bg-[#34D399] rounded-full opacity-60 animate-pulse top-20 right-10"></div>
                  <div className="absolute w-3 h-3 bg-[#34D399] rounded-full opacity-50 animate-bounce bottom-10 left-10"></div>
                  <div className="absolute w-5 h-5 bg-[#34D399] rounded-full opacity-70 animate-ping bottom-16 right-16"></div>
                  <div className="absolute w-3 h-3 bg-[#34D399] rounded-full opacity-60 animate-bounce top-10 right-20"></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Scan Form */}
        <div className="mx-auto max-w-7xl px-6 pb-16">
          <div className="rounded-2xl bg-[#142D4C] border border-[#1F3B5A] p-8">
            <label className="block text-sm font-medium mb-3">Enter URL or IP Address to Scan</label>
            <div className="flex gap-4 mb-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. https://your-website.com"
                disabled={isScanning}
                className="flex-1 rounded-lg bg-[#0D1B2A] border border-[#1F3B5A] px-4 py-3 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isScanning ? (
                <button
                  onClick={handleCancelScan}
                  className="rounded-lg bg-red-500 px-8 py-3 font-semibold text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
                >
                  Cancel Scan
                </button>
              ) : (
                <button
                  onClick={handleStartScan}
                  className="rounded-lg bg-[#34D399] px-8 py-3 font-semibold text-white hover:bg-[#2bb380] transition-all shadow-lg shadow-[#34D399]/30"
                >
                  Start Scan
                </button>
              )}
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="flex gap-8">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="scanType"
                  value="quick"
                  checked={scanType === "quick"}
                  onChange={(e) => setScanType(e.target.value)}
                  disabled={isScanning}
                  className="h-5 w-5 appearance-none rounded-full border-2 border-[#1F3B5A] bg-[#0D1B2A] checked:border-[#34D399] checked:bg-[#34D399] cursor-pointer transition-all"
                />
                <div>
                  <div className="font-medium group-hover:text-[#34D399]">Quick Scan</div>
                  <div className="text-sm text-gray-400">Fast results with limited checks.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="scanType"
                  value="full"
                  checked={scanType === "full"}
                  onChange={(e) => setScanType(e.target.value)}
                  disabled={isScanning}
                  className="h-5 w-5 appearance-none rounded-full border-2 border-[#1F3B5A] bg-[#0D1B2A] checked:border-[#34D399] checked:bg-[#34D399] cursor-pointer transition-all"
                />
                <div>
                  <div className="font-medium group-hover:text-[#34D399]">Full Scan</div>
                  <div className="text-sm text-gray-400">Maximum/Detailed report for web applications.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="text-2xl font-bold mb-6">Recent Scans</h2>
          <div className="rounded-2xl bg-[#142D4C] border border-[#1F3B5A] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 flex-1">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#34D399]/20 ring-4 ring-[#34D399]/30">
                  <svg
                    className="h-6 w-6 text-[#34D399]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <span className="font-medium">blogproject.net</span>
              </div>
              <div className="flex items-center gap-6 flex-1">
                <span className="text-gray-400">2023-10-26</span>
              </div>
              <div className="flex items-center gap-6 flex-1 justify-end">
                <span className="text-gray-400">Completed</span>
                <button className="rounded-lg border border-[#1F3B5A] px-6 py-2 text-sm font-medium hover:bg-[#34D399]/10 hover:border-[#34D399] transition-all">
                  View Log
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
