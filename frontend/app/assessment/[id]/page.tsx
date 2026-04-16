"use client";
import { useState, useEffect } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import MonacoEditor from "@/components/Editor/MonacoEditor";
import ProblemDescription from "@/components/Workspace/ProblemDescription";
import Console from "@/components/Workspace/Console";
import { useTimer } from "@/hooks/useTimer";
import { useLeetCodeBridge } from "@/hooks/useLeetCodeBridge";

interface QuestionData {
  questionId?: string;
  slug: string;
  url: string;
  title: string;
  difficulty: string;
  content: string;
  starter_code: string;
}

export default function AssessmentPage({ params }: { params: { id: string } }) {
  const [oaQuestions, setOaQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<QuestionData | null>(null);
  const [timeLimit, setTimeLimit] = useState(60);

  const [codeCache, setCodeCache] = useState<Record<string, string>>({});

  const { time, totalSeconds } = useTimer(timeLimit, () => {
    alert("Time is up! The assessment is now locked.");
  });
  
  const { runOnLeetCode, submitOnLeetCode, status, result } = useLeetCodeBridge();

  useEffect(() => {
    const stored = localStorage.getItem("current_oa");
    if (stored) {
      const parsed = JSON.parse(stored);
      setOaQuestions(parsed.questions || []);
      setTimeLimit(parsed.timeLimit || 60);
    }
  }, []);

  useEffect(() => {
    if (oaQuestions.length === 0) return;

    const currentQ = oaQuestions[currentIndex];
    const slug = currentQ.slug;
    const url = currentQ.url || `https://leetcode.com/problems/${slug}`;

    setActiveQuestion(null); 

    fetch(`http://localhost:8000/api/question/${slug}`)
      .then(res => res.json())
      .then((data) => {
        setActiveQuestion({ ...data, slug, url });
        
        if (codeCache[slug] === undefined) {
          setCodeCache(prev => ({ ...prev, [slug]: data.starter_code }));
        }
      })
      .catch(err => console.error("Failed to fetch question:", err));
  }, [currentIndex, oaQuestions]);

  const handleCodeChange = (newCode: string | undefined) => {
    if (!activeQuestion || newCode === undefined) return;
    if (newCode === "" && !codeCache[activeQuestion.slug]) return;
    setCodeCache(prev => ({ ...prev, [activeQuestion.slug]: newCode }));
  };

  const handleRun = () => {
    if (!activeQuestion?.slug) return;
    runOnLeetCode(
      activeQuestion.slug,
      codeCache[activeQuestion.slug] ?? activeQuestion.starter_code
    );
  };
 
  const handleSubmit = () => {
    if (!activeQuestion?.slug) return;
    submitOnLeetCode(
      activeQuestion.slug,
      codeCache[activeQuestion.slug] ?? activeQuestion.starter_code
    );
  };

  // --- Global Keyboard Shortcuts (Works when focus is outside the editor) ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      
      if (isCtrlOrCmd && e.key.toLowerCase() === 's') {
        e.preventDefault(); // Stop browser from saving the webpage
      } else if (isCtrlOrCmd && e.key === "'") {
        e.preventDefault();
        handleRun();
      } else if (isCtrlOrCmd && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeQuestion, codeCache, handleRun, handleSubmit]);

  if (oaQuestions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a] text-gray-500 font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Initializing Secure Environment...
        </div>
      </div>
    );
  }

  const currentCode = activeQuestion 
    ? (codeCache[activeQuestion.slug] !== undefined ? codeCache[activeQuestion.slug] : activeQuestion.starter_code) 
    : "";

  return (
    <main className="h-screen w-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Navbar: Added flex-shrink-0 so it never gets crushed by the editor */}
      <nav className="h-14 flex-shrink-0 border-b border-gray-800 flex items-center justify-between px-6 bg-[#1a1a1a]">
        <div className="flex items-center gap-8">
          <span className="text-blue-500 font-black italic tracking-widest text-lg">BRIDGE<span className="text-white">_OA</span></span>
          
          <div className="flex gap-2 bg-[#0f0f0f] p-1 rounded-md border border-gray-800">
            {oaQuestions.map((q, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded text-sm font-bold transition-all flex items-center justify-center ${
                  currentIndex === idx 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "bg-transparent text-gray-500 hover:bg-[#2a2a2a] hover:text-white"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 bg-[#0f0f0f] px-4 py-1.5 rounded-md border border-gray-800">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Time Left</span>
            <span className={`text-lg font-mono font-bold tracking-widest ${totalSeconds < 300 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
              {time}
            </span>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleRun} 
              className="px-6 py-2 rounded-md bg-[#252526] border border-gray-700 hover:bg-[#333] text-xs font-bold uppercase tracking-wider transition-all text-white active:scale-95"
            >
              Run Code
            </button>
            <button 
              onClick={handleSubmit} 
              className="px-6 py-2 rounded-md bg-green-600 hover:bg-green-500 text-xs font-bold uppercase tracking-wider transition-all text-white shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:shadow-[0_0_25px_rgba(22,163,74,0.5)] active:scale-95"
            >
              Submit Solution
            </button>
          </div>
        </div>
      </nav>

      {/* WORKSPACE: Wrapped in flex-1 min-h-0 to perfectly constraint the height and prevent pushing under navbar */}
      <div className="flex-1 min-h-0 w-full">
        <Group orientation="horizontal" className="h-full">
          <Panel defaultSize={40} minSize={25} className="bg-[#0f0f0f] overflow-y-auto">
            {!activeQuestion ? (
              <div className="h-full flex items-center justify-center text-gray-600 font-mono text-sm animate-pulse">
                Decrypting problem parameters...
              </div>
            ) : (
              <ProblemDescription 
                content={activeQuestion.content} 
                title={activeQuestion.title} 
                difficulty={activeQuestion.difficulty}
                url={activeQuestion.url} 
              />
            )}
          </Panel>

          <Separator className="w-1 bg-black hover:bg-blue-600 active:bg-blue-600 transition-colors cursor-col-resize" />

          <Panel defaultSize={60} minSize={30}>
            <Group orientation="vertical">
              <Panel defaultSize={70} minSize={20}>
                {/* Passed onRun and onSubmit down to the Monaco Editor */}
                <MonacoEditor 
                  code={currentCode} 
                  onChange={handleCodeChange} 
                  onRun={handleRun}
                  onSubmit={handleSubmit}
                />
              </Panel>

              <Separator className="h-1 bg-black hover:bg-blue-600 active:bg-blue-600 transition-colors cursor-row-resize" />

              <Panel defaultSize={30} minSize={10}>
                <Console 
                  output={status === "Running" || status === "Submitting" ? `[SYSTEM LOG]: ${result || status}...` : result} 
                />
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>
    </main>
  );
}