"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, X, Check, Code2, BrainCircuit, Zap, Clock, Calendar } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  
  // --- State ---
  const [metadata, setMetadata] = useState<{ companies: string[]; periods: string[]; total_count: number } | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [timeLimit, setTimeLimit] = useState(60);
  
  // DEFAULT: 3 Questions (1 Easy, 2 Medium, 0 Hard)
  const [difficultyDist, setDifficultyDist] = useState({ Easy: 1, Medium: 2, Hard: 0 });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Fetch Metadata ---
  useEffect(() => {
    fetch("https://oa-simulator.onrender.com/api/metadata")
      .then((res) => res.json())
      .then(setMetadata)
      .catch((err) => console.error("Failed to load metadata", err));
  }, []);

  // --- Click Outside ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Derived Data ---
  const filteredCompanies = metadata?.companies.filter((c) => 
    c.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalQuestions = difficultyDist.Easy + difficultyDist.Medium + difficultyDist.Hard;

  // --- Helpers ---
  const formatPeriod = (p: string) => {
    const map: Record<string, string> = {
      "three_months": "Last 3 Months",
      "six_months": "Last 6 Months",
      "one_year": "Last 1 Year",
      "all": "All Time",
      "historical_2022": "Historical (2022)"
    };
    return map[p] || p.replace('_', ' ').toUpperCase();
  };

  // --- Handlers ---
  const toggleCompany = (company: string) => {
    setSelectedCompanies((prev) => 
      prev.includes(company) ? prev.filter((c) => c !== company) : [...prev, company]
    );
    inputRef.current?.focus();
  };

  const togglePeriod = (period: string) => {
    setSelectedPeriods((prev) => 
      prev.includes(period) ? prev.filter((p) => p !== period) : [...prev, period]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen && e.key === "ArrowDown") {
      setIsDropdownOpen(true);
      return;
    }

    if (isDropdownOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < filteredCompanies.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        toggleCompany(filteredCompanies[focusedIndex]);
      } else if (e.key === "Escape") {
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
      }
    }
  };

  const updateDifficulty = (level: "Easy" | "Medium" | "Hard", delta: number) => {
    setDifficultyDist(prev => ({
      ...prev,
      [level]: Math.max(0, Math.min(10, prev[level] + delta))
    }));
  };

  const startOA = async () => {
    if (totalQuestions === 0) return alert("Please select at least 1 question.");

    const res = await fetch("https://oa-simulator.onrender.com/api/generate-oa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companies: selectedCompanies.length > 0 ? selectedCompanies : null,
        periods: selectedPeriods.length > 0 ? selectedPeriods : null,
        total_count: totalQuestions,
        difficulty_dist: difficultyDist
      }),
    });
    
    if (!res.ok) {
      const err = await res.json();
      return alert(`Failed to generate assessment: ${err.detail || "Unknown error"}`);
    }
    
    const data = await res.json();
    const payload = { ...data, timeLimit };
    localStorage.setItem("current_oa", JSON.stringify(payload));
    router.push(`/assessment/${data.test_id}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
      {/* Background Glow */}
      <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none blur-3xl" />

      <div className="z-10 max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-2 border border-blue-500/20">
            <Code2 size={32} className="text-blue-400" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white">
            BRIDGE<span className="text-blue-500">_OA</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Configure your technical assessment. 
            <br/> <span className="text-sm tracking-wide">Pool: {metadata ? metadata.total_count : "..."} real interview questions.</span>
          </p>
        </div>

        {/* Configuration Card */}
        <div className="bg-[#0f0f0f] border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          <div className="space-y-8">
            
            {/* 1. Target Companies */}
            <div className="space-y-3 relative" ref={dropdownRef}>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-widest">
                <BrainCircuit size={16} className="text-blue-400"/> Target Companies 
                <span className="text-gray-600 text-xs normal-case tracking-normal font-normal">(Default: Random All)</span>
              </label>

              {selectedCompanies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedCompanies.map(company => (
                    <span key={company} className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {company}
                      <button onClick={() => toggleCompany(company)} className="hover:text-white hover:bg-blue-500/20 rounded-full p-0.5 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <button onClick={() => setSelectedCompanies([])} className="text-xs text-gray-500 hover:text-gray-300 underline ml-2">Clear</button>
                </div>
              )}

              <div 
                className="relative flex items-center bg-[#151515] border border-gray-700 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all cursor-text"
                onClick={() => setIsDropdownOpen(true)}
              >
                <Search size={18} className="text-gray-500 ml-4" />
                <input 
                  ref={inputRef}
                  type="text"
                  placeholder="Search companies (leave empty for random)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    setFocusedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent p-4 text-sm outline-none text-white placeholder-gray-600"
                />
                <ChevronDown size={18} className="text-gray-500 mr-4" />
              </div>

              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredCompanies.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No companies found.</div>
                  ) : (
                    filteredCompanies.map((company, index) => {
                      const isSelected = selectedCompanies.includes(company);
                      const isFocused = index === focusedIndex;
                      return (
                        <div 
                          key={company}
                          onClick={() => toggleCompany(company)}
                          onMouseEnter={() => setFocusedIndex(index)}
                          className={`flex items-center justify-between p-3 cursor-pointer border-b border-gray-800/50 last:border-0 transition-colors ${
                            isFocused ? "bg-blue-500/10" : "hover:bg-[#252525]"
                          }`}
                        >
                          <span className={`text-sm font-medium uppercase ${isSelected ? "text-blue-400" : "text-gray-300"}`}>
                            {company}
                          </span>
                          {isSelected && <Check size={16} className="text-blue-400" />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* 2. Timeframe (Periods) Selector */}
            <div className="space-y-3 pt-4 border-t border-gray-800">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-widest">
                <Calendar size={16} className="text-purple-400"/> Timeframe
                <span className="text-gray-600 text-xs normal-case tracking-normal font-normal">(Default: All Periods)</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {metadata?.periods?.map((period) => (
                  <button
                    key={period}
                    onClick={() => togglePeriod(period)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                      selectedPeriods.includes(period)
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                        : "bg-[#151515] text-gray-500 border-gray-800 hover:border-gray-600 hover:text-gray-300"
                    }`}
                  >
                    {formatPeriod(period)}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Grid for Spread & Timer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-800">
              {/* Difficulty Spread */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-widest">
                  <Zap size={16} className="text-yellow-400"/> Difficulty Spread
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Easy", "Medium", "Hard"] as const).map((level) => (
                    <div key={level} className="bg-[#151515] border border-gray-800 rounded-xl p-3 flex flex-col items-center gap-2 transition-colors hover:border-gray-700">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        level === 'Easy' ? 'text-green-400' : level === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>{level}</span>
                      <div className="flex items-center gap-2 bg-[#0a0a0a] rounded border border-gray-800 p-1">
                        <button onClick={() => updateDifficulty(level, -1)} className="w-6 h-6 flex justify-center items-center text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">-</button>
                        <span className="text-xs font-mono font-bold w-3 text-center">{difficultyDist[level]}</span>
                        <button onClick={() => updateDifficulty(level, 1)} className="w-6 h-6 flex justify-center items-center text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div className="space-y-4">
                <label className="flex items-center justify-between text-sm font-bold text-gray-300 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Clock size={16} className="text-blue-400"/> Timer</span>
                  <span className="text-blue-400 font-mono text-xs bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">{timeLimit} mins</span>
                </label>
                <div className="h-full flex items-center px-2">
                  <input 
                    type="range" min="15" max="180" step="15"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-6">
              <button 
                onClick={startOA}
                disabled={totalQuestions === 0}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 active:scale-[0.99]"
              >
                {selectedCompanies.length === 0 ? `Start Random Assessment (${totalQuestions} Qs)` : `Start Assessment (${totalQuestions} Qs)`}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}