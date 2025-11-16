import { useState, useEffect } from "react"

export default function Vulnerabilities({ user }) { // user prop indicates if logged in
  const [vulnerabilities, setVulnerabilities] = useState([])
  const [loading, setLoading] = useState(true)
  const API_BASE_URL = "http://127.0.0.1:8000"

  useEffect(() => {
    const fetchLatestVulnerabilities = async () => {
      if (!user) {
        // If not logged in, show static placeholder vulnerabilities
        setVulnerabilities([
          { name: 'SQL Injection', status: 'unknown' },
          { name: 'Cross-Site Scripting (XSS)', status: 'unknown' },
          { name: 'Outdated Libraries', status: 'unknown' },
          { name: 'TLS/SSL Issues', status: 'unknown' },
          { name: 'Information Disclosure', status: 'unknown' },
        ])
        setLoading(false)
        return
      }

      try {
        // Get latest scan for logged-in user
        const scansRes = await fetch(`${API_BASE_URL}/scans?limit=1`, {
          credentials: "include",
        })
        
        if (scansRes.ok) {
          const scansData = await scansRes.json()
          if (scansData.scans && scansData.scans.length > 0) {
            const latestScan = scansData.scans[0]
            
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
  }, [user])

  const commonVulns = [
    { name: 'SQL Injection', type: 'sql_injection' },
    { name: 'Cross-Site Scripting (XSS)', type: 'xss' },
    { name: 'Outdated Libraries', type: 'outdated' },
    { name: 'TLS/SSL Issues', type: 'tls' },
    { name: 'Information Disclosure', type: 'info_disclosure' }
  ]

  const getVulnStatus = (vulnName, detectedVulns) => {
    if (!detectedVulns || detectedVulns.length === 0) {
      return { status: 'unknown', icon: '?' } // static placeholder state
    }

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
            {[1, 2, 3, 4, 5].map(i => (
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
          Common Vulnerabilities {vulnerabilities.length > 0 && user && `(${vulnerabilities.length} found)`}
        </h3>
        
        <div className="space-y-3">
          {commonVulns.map((vuln, index) => {
            const status = getVulnStatus(vuln.name, vulnerabilities)
            
            return (
              <div
                key={index}
                className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    status.status === 'safe' ? 'bg-teal-500' :
                    status.status === 'warning' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`}>
                    <span className="text-white font-bold text-sm">{status.icon}</span>
                  </div>
                  <span className="text-sm text-slate-200">{vuln.name}</span>
                </div>
                
                <div>
                  {status.status === 'safe' ? (
                    <span className="text-green-400 text-lg">✅</span>
                  ) : status.status === 'warning' ? (
                    <span className="text-orange-400 text-lg">⚠️</span>
                  ) : (
                    <span className="text-gray-400 text-lg">❔</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {vulnerabilities.length === 0 && user && (
          <div className="text-center text-slate-400 mt-4 text-sm">
            No vulnerabilities detected in latest scan
          </div>
        )}
      </div>
    </div>
  )
}
