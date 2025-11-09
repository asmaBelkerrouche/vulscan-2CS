import { useState, useEffect } from "react"

export default function Vulnerabilities() {
  const [vulnerabilities, setVulnerabilities] = useState([])
  const [loading, setLoading] = useState(true)
  const API_BASE_URL = "http://127.0.0.1:8000"

  useEffect(() => {
    const fetchLatestVulnerabilities = async () => {
      try {
        // Get latest scan
        const scansRes = await fetch(`${API_BASE_URL}/scans?limit=1`, {
          credentials: "include",
        })
        
        if (scansRes.ok) {
          const scansData = await scansRes.json()
          if (scansData.scans && scansData.scans.length > 0) {
            const latestScan = scansData.scans[0]
            
            // Get vulnerabilities from report
            if (latestScan.status === "completed") {
              const scanId = latestScan.scanId.replace('s_', '')
              const reportRes = await fetch(`${API_BASE_URL}/scans/${scanId}/report`, {
                credentials: "include",
              })
              
              if (reportRes.ok) {
                const reportData = await reportRes.json()
                setVulnerabilities(reportData.vulnerabilities || [])
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching vulnerabilities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestVulnerabilities()
  }, [])

  // Common vulnerability types to check for
  const commonVulns = [
    { name: 'SQL Injection', type: 'sql_injection' },
    { name: 'Cross-Site Scripting (XSS)', type: 'xss' },
    { name: 'Outdated Libraries', type: 'outdated' },
    { name: 'TLS/SSL Issues', type: 'tls' },
    { name: 'Information Disclosure', type: 'info_disclosure' }
  ]

  const getVulnStatus = (vulnName, detectedVulns) => {
    const found = detectedVulns.some(v => 
      v.name.toLowerCase().includes(vulnName.toLowerCase().split(' ')[0])
    )
    return {
      status: found ? 'warning' : 'safe',
      icon: found ? '!' : '✓'
    }
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6">Common Vulnerabilities</h3>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-slate-700/50 p-4 rounded-lg">
                <div className="h-4 bg-slate-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6">
          Common Vulnerabilities {vulnerabilities.length > 0 && `(${vulnerabilities.length} found)`}
        </h3>
        
        {/* Vulnerabilities List */}
        <div className="space-y-3">
          {commonVulns.map((vuln, index) => {
            const status = getVulnStatus(vuln.name, vulnerabilities)
            
            return (
              <div
                key={index}
                className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700 transition-colors"
              >
                {/* Left Side - Icon and Name */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    status.status === 'safe' ? 'bg-teal-500' : 'bg-orange-500'
                  }`}>
                    <span className="text-white font-bold text-sm">{status.icon}</span>
                  </div>
                  <span className="text-sm text-slate-200">{vuln.name}</span>
                </div>
                
                {/* Right Side - Status */}
                <div>
                  {status.status === 'safe' ? (
                    <span className="text-green-400 text-lg">✅</span>
                  ) : (
                    <span className="text-orange-400 text-lg">⚠️</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {vulnerabilities.length === 0 && (
          <div className="text-center text-slate-400 mt-4 text-sm">
            No vulnerabilities detected in latest scan
          </div>
        )}
      </div>
    </div>
  )
}
