export default function ScanButton() {
    return (
      <div className="flex justify-start">
        <button
          className="relative px-16 py-6 rounded-full text-lg font-semibold text-slate-900 bg-white
                     transition-all duration-500 hover:scale-105"
        >
          Scan Now
  
          {/* Glowing border effect */}
          <span className="absolute inset-0 rounded-full border-2 border-blue-400 shadow-[0_0_15px_4px_rgba(59,130,246,0.6)] transition-all duration-500 hover:shadow-[0_0_25px_8px_rgba(59,130,246,0.8)]"></span>
        </button>
      </div>
    );
  }
  