export default function Vulnerabilities() {
  const vulnerabilities = [
    { name: "SQL Injection", icon: "i", status: "safe" },
    { name: "Cross-Site Scripting (XSS)", icon: "X", status: "safe" },
    { name: "Outdated Libraries", icon: "!", status: "warning" }
  ];

  return (
    <div className="w-full">
      <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6">
          Common Vulnerabilities
        </h3>

        {/* Vulnerabilities List */}
        <div className="space-y-3">
          {vulnerabilities.map((vuln, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700 transition-colors"
            >
              {/* Left Side - Icon and Name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{vuln.icon}</span>
                </div>
                <span className="text-sm text-slate-200">{vuln.name}</span>
              </div>

              {/* Right Side - Status */}
              <div>
                {vuln.status === "safe" ? (
                  <span className="text-green-400 text-lg">✅</span>
                ) : (
                  <span className="text-orange-400 text-lg">⚠️</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
