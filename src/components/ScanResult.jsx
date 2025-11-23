import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { useState, useEffect } from "react"

export default function ScanResult({ user }) { // Add user prop
  const [scanData, setScanData] = useState(null)
  const [loading, setLoading] = useState(true)
  const API_BASE_URL = "http://127.0.0.1:8000"

  useEffect(() => {
    const fetchLatestScan = async () => {
      if (!user) {
        // If not logged in, show static placeholder data
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
        // ADDED TRAILING SLASH
        const res = await fetch(`${API_BASE_URL}/scans/?limit=1`, {
          method: "GET",
          credentials: "include",
        })
        
        // Check if response is JSON before parsing
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Authentication required. Please log in.")
        }
        
        if (res.ok) {
          const data = await res.json()
          if (data.scans && data.scans.length > 0) {
            const latestScan = data.scans[0]
            
            // If scan is completed, fetch the report for vulnerability counts
            if (latestScan.status === "completed") {
              const scanId = latestScan.scanId.replace('s_', '')
              // ADDED TRAILING SLASH
              const reportRes = await fetch(`${API_BASE_URL}/scans/${scanId}/report/`, {
                credentials: "include",
              })
              
              // Check if report response is JSON
              const reportContentType = reportRes.headers.get("content-type")
              if (!reportContentType || !reportContentType.includes("application/json")) {
                setScanData({
                  target: latestScan.target,
                  status: latestScan.status,
                  summary: null
                })
                return
              }
              
              if (reportRes.ok) {
                const reportData = await reportRes.json()
                setScanData({
                  target: latestScan.target,
                  status: latestScan.status,
                  summary: reportData.summary
                })
              } else {
                setScanData({
                  target: latestScan.target,
                  status: latestScan.status,
                  summary: null
                })
              }
            } else {
              setScanData({
                target: latestScan.target,
                status: latestScan.status,
                summary: null
              })
            }
          } else {
            setScanData(null) // No scans found
          }
        } else {
          throw new Error(`Failed to fetch scans: ${res.status} ${res.statusText}`)
        }
      } catch (error) {
        console.error("Error fetching scan data:", error)
        // Fallback to static data on error
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
        setLoading(false)
      }
    }

    fetchLatestScan()
  }, [user]) // Add user to dependencies

  // Calculate pie chart data from vulnerability summary
  const getChartData = () => {
    if (!scanData?.summary) {
      return [
        { name: "No Data", value: 100 }
      ]
    }

    const totalVulns = scanData.summary.critical + scanData.summary.high + 
                      scanData.summary.medium + scanData.summary.low + scanData.summary.info
    
    if (totalVulns === 0) {
      return [
        { name: "Safe", value: 100 },
        { name: "Vulnerabilities", value: 0 }
      ]
    }

    return [
      { name: "Safe", value: Math.max(0, 100 - totalVulns) },
      { name: "Vulnerabilities", value: totalVulns }
    ]
  }

  const data = getChartData()
  const COLORS = ["#22c55e", "#f97316"]

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

  return (
    <div className="bg-white backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-10 flex flex-col md:flex-row items-center justify-between w-full max-w-5xl">
      {/* LEFT SIDE — TEXT */}
      <div className="flex-1">
        <h2 className="text-3xl text-black font-bold mt-4 mb-4 tracking-wide">
          Scan Result Summary
        </h2>
        <p className="text-gray-500 text-lg leading-relaxed font-medium">
          {scanData ? (
            <>
              {!user ? (
                "Welcome to VulnScanner! Log in to start scanning and see real results here."
              ) : (
                <>
                  Latest scan of <strong>{scanData.target}</strong> shows {
                    scanData.summary ? (
                      `${scanData.summary.total} total vulnerabilities detected.`
                    ) : (
                      `scan is ${scanData.status}.`
                    )
                  }
                </>
              )}
            </>
          ) : (
            "No scan data available. Start your first scan to see results here."
          )}
        </p>
      </div>

      {/* RIGHT SIDE — PIE CHART */}
      <div className="w-full md:w-1/3 h-72 mt-10 md:mt-0 flex flex-col justify-center items-center">
        <h3 className="text-gray-300 mb-2 text-xl font-semibold tracking-wide uppercase">
          Detection Ratio
        </h3>
        <div className="w-1 h-2 rounded-full bg-gray-300 mb-2"></div>
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
              paddingAngle={4}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index]}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
