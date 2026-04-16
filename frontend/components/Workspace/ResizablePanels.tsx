"use client";
import { useState, useEffect } from "react";
// Updated Imports for V4.0+
import { Panel, Group, Separator } from "react-resizable-panels";
import MonacoEditor from "@/components/Editor/MonacoEditor";
import ProblemDescription from "@/components/Workspace/ProblemDescription";
import Console from "@/components/Workspace/Console";

export default function ResizablePanels({ params }: { params: { id: string } }) {
  const [question, setQuestion] = useState<any>(null);
  const [code, setCode] = useState<string>("");
  const [customInput, setCustomInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  useEffect(() => {
    // For now, using a hardcoded slug to test the bridge
    const slug = "house-robber-ii"; 
    fetch(`http://localhost:8000/api/question/${slug}`)
      .then(res => res.json())
      .then(data => {
        setQuestion(data);
        setCode(data.starter_code);
        setCustomInput(data.sample_input);
      });
  }, []);

  const runCode = () => {
    window.dispatchEvent(new CustomEvent("RUN_ON_LEETCODE", {
      detail: { slug: "house-robber-ii", code, input: customInput }
    }));
    setOutput("Running on LeetCode engine...");
  };

  return (
    <main className="h-screen w-screen flex flex-col bg-[#0a0a0a]">
      {/* Navbar stays the same */}
      <nav className="h-12 border-b border-gray-800 flex items-center justify-between px-6 bg-[#1a1a1a]">
        <div className="flex items-center gap-4">
          <span className="text-blue-500 font-black italic">BRIDGE_OA</span>
          <div className="h-4 w-[1px] bg-gray-700" />
          <span className="text-sm font-mono text-yellow-500">44:59</span>
        </div>
        <div className="flex gap-3">
          <button onClick={runCode} className="px-4 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-xs font-bold uppercase transition-all">Run</button>
          <button className="px-4 py-1.5 rounded bg-green-600 hover:bg-green-500 text-xs font-bold uppercase transition-all">Submit Test</button>
        </div>
      </nav>

      {/* Main Workspace using updated V4 syntax */}
      <Group orientation="horizontal">
        <Panel defaultSize={40} minSize={25} className="bg-[#0f0f0f] overflow-y-auto">
          <ProblemDescription 
            content={question?.content} 
            title={question?.title} 
            difficulty={question?.difficulty} 
          />
        </Panel>

        {/* PanelResizeHandle is now Separator */}
        <Separator className="w-1 bg-black hover:bg-blue-600 active:bg-blue-600 transition-colors cursor-col-resize" />

        <Panel defaultSize={60} minSize={30}>
          <Group orientation="vertical">
            <Panel defaultSize={70} minSize={20}>
              <MonacoEditor code={code} onChange={(val) => setCode(val || "")} />
            </Panel>

            <Separator className="h-1 bg-black hover:bg-blue-600 active:bg-blue-600 transition-colors cursor-row-resize" />

            <Panel defaultSize={30} minSize={10}>
              {/* <Console output={output} customInput={customInput} setCustomInput={setCustomInput} /> */}
            </Panel>
          </Group>
        </Panel>
      </Group>
    </main>
  );
}