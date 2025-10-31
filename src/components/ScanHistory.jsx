export default function ScanHistory() {
    const historyData = [
      {
        date: '2023-10-26',
        target: 'myportfolio.com',
        status: 'Cancelled',
        statusType: 'cancelled',
        report: 'View PDF'
      },
      {
        date: '',
        target: 'blogproject.net',
        status: 'New PDF',
        statusType: 'new',
        report: ''
      },
      {
        date: '',
        target: 'finallproject.net',
        status: 'View Log',
        statusType: 'log',
        report: ''
      }
    ];
  
    return (
      <div className="">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Scan History</h3>
            
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 text-xs text-slate-400 mb-4 px-3">
              <div>Date</div>
              <div>Target</div>
              <div>Status</div>
              <div>Report</div>
            </div>
            
            {/* Table Rows */}
            <div className="space-y-3">
              {historyData.map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 items-center bg-slate-700/50 p-3 rounded-lg hover:bg-slate-700 transition-colors">
                  <div className="text-sm text-slate-300">
                    {item.date || '-'}
                  </div>
                  <div className="text-sm text-slate-300">
                    {item.target}
                  </div>
                  <div className="text-sm">
                    {item.statusType === 'cancelled' && (
                      <span className="text-slate-300">{item.status}</span>
                    )}
                    {item.statusType === 'new' && (
                      <span className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium">
                        {item.status}
                      </span>
                    )}
                    {item.statusType === 'log' && (
                      <span className="text-blue-400 cursor-pointer hover:underline">{item.status}</span>
                    )}
                  </div>
                  <div className="text-sm">
                    {item.report ? (
                      <span className="text-blue-400 cursor-pointer hover:underline">{item.report}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }