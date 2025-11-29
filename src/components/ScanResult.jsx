import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { useState, useEffect } from "react"

export default function ScanResult({ user }) { // Receives user prop to check login state
  const [scanData, setScanData] = useState(null) // Stores latest scan + report summary
  const [loading, setLoading] = useState(true)   // Controls loading UI
  const API_BASE_URL = "http://127.0.0.1:8000"   // Backend URL

  useEffect(() => {
    // Fetch latest scan when component loads or user changes
    const fetchLatestScan = async () => {

      // If user is not logged in → show demo placeholder scan
      if (!user) {
        setScanData({
          target: "example.com",
          status: "completed",
          summary: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0,
            total: 0
          }
        })
        setLoading(false)
        return
      }

      try {
        // Fetch the most recent scan (limit=1)
        const res = await fetch(`${API_BASE_URL}/scans/?limit=1`, {
          method: "GET",
          credentials: "include", // important for session cookies
        })
        
        // Ensure backend responded with JSON (otherwise → auth issue)
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Authentication required. Please log in.")
        }
        
        if (res.ok) {
          const data = await res.json()

          // Check if any scans exist
          if (data.scans && data.scans.length > 0) {
            const latestScan = data.scans[0]
            
            // If scan completed → also fetch detailed report summary
            if (latestScan.status === "completed") {
              const scanId = latestScan.scanId.replace('s_', '')

              const reportRes = await fetch(`${API_BASE_URL}/scans/${scanId}/report/`, {
                credentials: "include",
              })
              
              // Verify JSON response
              const reportContentType = reportRes.headers.get("content-type")
              if (!reportContentType || !reportContentType.includes("application/json")) {
                // If no report available → show scan without summary
                setScanData({
                  target: latestScan.target,
                  status: latestScan.status,
                  summary: null
                })
                return
              }
              
              // If report fetched successfully, store summary
              if (reportRes.ok) {
                const reportData = await reportRes.json()
                setScanData({
                  target: latestScan.target,
                  status: latestScan.status,
                  summary: reportData.summary
                })
              } else {
                // Failed report fetch → still show basic scan info
                setScanData({
                  target: latestScan.target,
                  status: latestScan.status,
                  summary: null
                })
              }
            } else {
              // If scan is still running / queued / failed
              setScanData({
                target: latestScan.target,
                status: latestScan.status,
                summary: null
              })
            }
          } else {
            // No scans found at all
            setScanData(null)
          }
        } else {
          throw new Error(`Failed to fetch scans: ${res.status} ${res.statusText}`)
        }
      } catch (error) {
        console.error("Error fetching scan data:", error)

        // Fallback static data on any API failure
        setScanData({
          target: "example.com",
          status: "completed",
          summary: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0,
            total: 0
          }
        })
      } finally {
        // Stop loading animation
        setLoading(false)
      }
    }

    fetchLatestScan()
  }, [user]) // Re-run when user login state changes

  // -------------------------------------
  // Converts vulnerability summary → Pie chart format
  // -------------------------------------
  const getChartData = () => {
    if (!scanData?.summary) {
      // No summary available (scan pending or failed)
      return [{ name: "No Data", value: 100 }]
    }

    // Count total vulnerabilities
    const totalVulns =
      scanData.summary.critical +
      scanData.summary.high +
      scanData.summary.medium +
      scanData.summary.low +
      scanData.summary.info

    // If no vulnerabilities → show "Safe"
    if (totalVulns === 0) {
      return [
        { name: "Safe", value: 100 },
        { name: "Vulnerabilities", value: 0 }
      ]
    }

    // Chart representing safe vs vulnerable areas (simplified)
    return [
      { name: "Safe", value: Math.max(0, 100 - totalVulns) },
      { name: "Vulnerabilities", value: totalVulns }
    ]
  }

  const data = getChartData()
  const COLORS = ["#22c55e", "#f97316"] // Safe = green, Vulnerable = orange

  // -------------------------------------
  // LOADING SKELETON
  // -------------------------------------
  if (loading) {
    return (
      <div className="bg-white backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-10 w-full max-w-5xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  // -------------------------------------
  // MAIN UI: TEXT + PIE CHART
  // -------------------------------------
  return (
    <div className="bg-white backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-10 flex flex-col md:flex-row items-center justify-between w-full max-w-5xl">
      
      {/* LEFT SECTION — Scan Text Summary */}
      <div className="flex-1">
        <h2 className="text-3xl text-black font-bold mt-4 mb-4 tracking-wide">
          Scan Result Summary
        </h2>

        <p className="text-gray-500 text-lg leading-relaxed font-medium">
          {scanData ? (
            <>
              {/* If not logged in → show welcome message */}
              {!user ? (
                "Welcome to VulnScanner! Log in to start scanning and see real results here."
              ) : (
                <>
                  {/* User logged in → show latest scan information */}
                  Latest scan of <strong>{scanData.target}</strong> shows{" "}
                  {scanData.summary ? (
                    `${scanData.summary.total} total vulnerabilities detected.`
                  ) : (
                    `scan is ${scanData.status}.`
                  )}
                </>
              )}
            </>
          ) : (
            "No scan data available. Start your first scan to see results here."
          )}
        </p>
      </div>

      {/* RIGHT SECTION — Pie Chart */}
      <div className="w-full md:w-1/3 h-72 mt-10 md:mt-0 flex flex-col justify-center items-center">
        <h3 className="text-gray-300 mb-2 text-xl font-semibold tracking-wide uppercase">
          Detection Ratio
        </h3>

        {/* Decorative separator bar */}
        <div className="w-1 h-2 rounded-full bg-gray-300 mb-2"></div>

        {/* Recharts Pie Chart */}
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="95%"
              strokeWidth={5}
              dataKey="value"
              paddingAngle={4} // Creates spacing between slices
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
