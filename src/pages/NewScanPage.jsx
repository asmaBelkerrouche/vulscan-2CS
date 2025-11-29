"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"

export default function NewScanPage() {
  // -------------------------------
  // State variables
  // -------------------------------
  const [scanType, setScanType] = useState("quick")        // "quick" or "full" scan mode
  const [url, setUrl] = useState("")                      // Target URL/IP/CIDR input
  const [isScanning, setIsScanning] = useState(false)     // Flag: is a scan in progress
  const [progress, setProgress] = useState(0)             // Scan progress %
  const [estimatedTime, setEstimatedTime] = useState(30)  // Estimated time left in seconds
  const [error, setError] = useState("")                  // Error messages
  const [userName, setUserName] = useState("UserName")    // Logged-in user name
  const [scanComplete, setScanComplete] = useState(false) // Flag: scan finished
  const [currentScan, setCurrentScan] = useState(null)    // Current scan object
  const [recentScans, setRecentScans] = useState([])      // List of last 5 scans
  const navigate = useNavigate()                          // Router navigation
  const API_BASE_URL = "http://127.0.0.1:8000"            // Backend API URL

  // Ref to track if user requested to cancel scan (prevents polling interference)
  const cancelRequestedRef = useRef(false)

  // -------------------------------
  // Fetch user profile and recent scans on page load
  // -------------------------------
  useEffect(() => {
    const fetchUserAndScans = async () => {
      try {
        // Fetch user profile
        const profileRes = await fetch(`${API_BASE_URL}/profile`, {
          method: "GET",
          credentials: "include",
        })
        
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setUserName(`${profileData.user.firstName} ${profileData.user.lastName}` || "UserName")
        }

        // Fetch recent scans (limit 5)
        const scansRes = await fetch(`${API_BASE_URL}/scans/?limit=5`, {
          method: "GET",
          credentials: "include",
        })
        
        if (scansRes.ok) {
          const scansData = await scansRes.json()
          setRecentScans(scansData.scans || [])
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      }
    }

    fetchUserAndScans()
  }, [])

  // -------------------------------
  // Poll backend for scan progress every 2s
  // -------------------------------
  useEffect(() => {
    let interval
    if (isScanning && currentScan) {
      cancelRequestedRef.current = false  // Reset cancel flag

      interval = setInterval(async () => {
        try {
          if (cancelRequestedRef.current) { // Stop polling if cancel requested
            clearInterval(interval)
            return
          }

          const scanId = currentScan.scanId.replace('s_', '')
          const res = await fetch(`${API_BASE_URL}/scans/${scanId}/`, {
            method: "GET",
            credentials: "include",
          })
          
          if (res.ok) {
            const scanData = await res.json()
            setProgress(scanData.progress || 0)

            if (scanData.estimatedTimeLeft) {
              setEstimatedTime(scanData.estimatedTimeLeft)
            }

            // Scan finished successfully
            if (scanData.status === "completed") {
              setIsScanning(false)
              setScanComplete(true)
              setProgress(100)
              clearInterval(interval)

              // Refresh recent scans
              const scansRes = await fetch(`${API_BASE_URL}/scans/?limit=5`, {
                method: "GET",
                credentials: "include",
              })
              if (scansRes.ok) {
                const scansData = await scansRes.json()
                setRecentScans(scansData.scans || [])
              }

            // Scan failed or canceled
            } else if (scanData.status === "failed" || scanData.status === "canceled") {
              setIsScanning(false)
              setError(`Scan ${scanData.status}`)
              clearInterval(interval)
              setCurrentScan(null)
            }
          }
        } catch (err) {
          console.error("Error polling scan status:", err)
        }
      }, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isScanning, currentScan])

  // -------------------------------
  // Start a new scan
  // -------------------------------
  const handleStartScan = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL, IP address, or CIDR range")
      return
    }

    setError("")
    setIsScanning(true)
    setProgress(0)
    setEstimatedTime(scanType === "quick" ? 30 : 120)

    try {
      const res = await fetch(`${API_BASE_URL}/scans/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: url.trim(),
          mode: scanType,
        }),
      })

      const responseData = await res.json()
      if (!res.ok) throw new Error(responseData?.error?.message || "Failed to start scan")

      setCurrentScan(responseData)
      setError("")
    } catch (err) {
      console.error("Error starting scan:", err)
      setError(err.message || "Failed to start scan")
      setIsScanning(false)
    }
  }

  // -------------------------------
  // Cancel ongoing scan
  // -------------------------------
  const handleCancelScan = async () => {
    if (!currentScan) return

    try {
      cancelRequestedRef.current = true // Stop polling

      const scanId = currentScan.scanId.replace('s_', '')
      const res = await fetch(`${API_BASE_URL}/scans/${scanId}/cancel/`, {
        method: "POST",
        credentials: "include",
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData?.error?.message || "Failed to cancel scan")
      }

      // Reset UI
      setIsScanning(false)
      setProgress(0)
      setEstimatedTime(30)
      setCurrentScan(null)
      setError("Scan cancelled successfully")

      // Refresh recent scans
      const scansRes = await fetch(`${API_BASE_URL}/scans/?limit=5`, {
        method: "GET",
        credentials: "include",
      })
      if (scansRes.ok) {
        const scansData = await scansRes.json()
        setRecentScans(scansData.scans || [])
      }
    } catch (err) {
      console.error("Error cancelling scan:", err)
      setError(err.message || "Failed to cancel scan")
      setIsScanning(false)
      setCurrentScan(null)
      cancelRequestedRef.current = false
    }
  }

  // -------------------------------
  // Reset form to scan again
  // -------------------------------
  const handleScanAgain = () => {
    setScanComplete(false)
    setIsScanning(false)
    setProgress(0)
    setEstimatedTime(30)
    setUrl("")
    setError("")
    setCurrentScan(null)
    cancelRequestedRef.current = false
  }

  // -------------------------------
  // Navigate to scan report page
  // -------------------------------
  const handleViewReport = (scanId) => {
    const numericScanId = scanId.replace('s_', '')
    navigate(`/scans/${numericScanId}`)
  }

  // -------------------------------
  // Download scan report (PDF/HTML/JSON)
  // -------------------------------
  const handleDownloadReport = async (scanId, format = "pdf") => {
    try {
      const numericScanId = scanId.replace('s_', '')
      const res = await fetch(`${API_BASE_URL}/scans/${numericScanId}/download?format=${format}`, {
        method: "GET",
        credentials: "include",
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData?.detail || "Failed to download report")
      }

      // Create downloadable file
      if (format === "json") {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `scan_${scanId}_report.json`
        link.click()
        window.URL.revokeObjectURL(url)
      } else if (format === "html") {
        const html = await res.text()
        const blob = new Blob([html], { type: "text/html" })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `scan_${scanId}_report.html`
        link.click()
        window.URL.revokeObjectURL(url)
      } else {
        // PDF download
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `scan_${scanId}_report.pdf`
        link.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error("Error downloading report:", err)
      setError(err.message || "Failed to download report")
    }
  }

  // -------------------------------
  // Utility: format seconds to "X minutes Y seconds"
  // -------------------------------
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins} minute${mins !== 1 ? "s" : ""} ${secs} second${secs !== 1 ? "s" : ""}`
  }

  // -------------------------------
  // Utility: map scan status to color
  // -------------------------------
  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "text-green-400"
      case "running": return "text-blue-400"
      case "queued": return "text-yellow-400"
      case "failed": return "text-red-400"
      case "canceled": return "text-gray-400"
      default: return "text-gray-400"
    }
  }

  // -------------------------------
  // Utility: format ISO date string
  // -------------------------------
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  // -------------------------------
  // Render: Success screen after scan completes
  // -------------------------------
  if (scanComplete && currentScan) {
    return (
      <div className="bg-[#0D1B2A] min-h-screen">
        {/* ... success screen content ... */}
      </div>
    )
  }

  // -------------------------------
  // Render: Main Scan Page
  // -------------------------------
  return (
    <div className="bg-[#0D1B2A] min-h-screen">
      {/* Error Message */}
      {error && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
          error.includes("Error") || error.includes("Failed") 
            ? "bg-red-500 text-white" 
            : "bg-[#34D399] text-white"
        }`}>
          {error}
        </div>
      )}

      {/* Hero Section: shows scanning animation or scan intro */}
      {/* Scan Form: URL input, scan type, start/cancel scan */}
      {/* Recent Scans: list last 5 scans */}
    </div>
  )
}
