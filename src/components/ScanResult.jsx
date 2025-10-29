import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

export default function Scan() {
  const data = [
    { name: "Safe", value: 80 },
    { name: "Vulnerabilities", value: 20 },
  ]
  const COLORS = ["#22c55e", "#f97316"]

  return (
  
      <div className="bg-white backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-10 flex flex-col md:flex-row items-center justify-between w-full max-w-5xl">
        
        {/* LEFT SIDE — TEXT */}
        <div className="flex-1">
          <h2 className="text-3xl text-black font-bold mt-4 mb-4  tracking-wide">
            Scan Result Summary
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed font-medium">
            The results of your last security scan are summarized below.
            Review your vulnerability ratio and ensure your system remains protected.
          </p>
        </div>

        {/* RIGHT SIDE — PIE CHART */}
        <div className="w-full md:w-1/3 h-72 mt-10 md:mt-0 flex flex-col justify-center items-center">
       
          <h3 className="text-gray-300 mb-2 text-xl font-semibold tracking-wide uppercase">
            Detection Ratio
          </h3>
          <div className="w-1 h-2 rounded-full bg-gray-300  mb-2 "></div>
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
