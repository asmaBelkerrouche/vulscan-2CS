import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function ScanHistory() {
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const API_BASE_URL = "http://127.0.0.1:8000"

  useEffect(() => {
    const fetchScanHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/scans?limit=3`, {
          method: "GET",
          credentials: "include",
        })

        if (res.ok) {
          const data = await res.json()
          setHistoryData(data.scans || [])
        }
      } catch (error) {
        console.error("Error fetching scan history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchScanHistory()
  }, [])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case "completed": return { text: "Completed", type: "completed" }
      case "running": return { text: "In Progress", type: "running" }
      case "queued": return { text: "Queued", type: "queued" }
      case "failed": return { text: "Failed", type: "failed" }
      case "canceled": return { text: "Cancelled", type: "cancelled" }
      default: return { text: status, type: "unknown" }
    }
  }

  if (loading) {
    return (
      <div className="max-w-md w-full">
        <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6">Scan History</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-700/50 p-3 rounded-lg">
                <div className="h-4 bg-slate-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full">
      <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6">Recent Scans</h3>
        
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 text-xs text-slate-400 mb-4 px-3">
          <div>Date</div>
          <div>Target</div>
          <div>Status</div>
          <div>Mode</div>
        </div>
        
        {/* Table Rows */}
        <div className="space-y-3">
          {historyData.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-4">
              No scans found
            </div>
          ) : (
            historyData.map((item, index) => {
              const status = getStatusDisplay(item.status)
              
              return (
                <div 
                  key={item.scanId} 
                  className="grid grid-cols-4 gap-4 items-center bg-slate-700/50 p-3 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                  onClick={() => navigate(`/scans/${item.scanId.replace('s_', '')}`)}
                >
                  <div className="text-sm text-slate-300">
                    {formatDate(item.createdAt)}
                  </div>
                  <div className="text-sm text-slate-300 truncate">
                    {item.target}
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      status.type === 'completed' ? 'bg-green-500 text-white' :
                      status.type === 'running' ? 'bg-blue-500 text-white' :
                      status.type === 'failed' ? 'bg-red-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {status.text}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 capitalize">
                    {item.mode}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}