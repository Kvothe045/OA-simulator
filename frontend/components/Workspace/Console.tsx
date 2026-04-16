"use client";
import { Terminal } from "lucide-react";

interface Props {
  output: string;
}

export default function Console({ output }: Props) {
  const isError = output.toLowerCase().includes("error") || output.toLowerCase().includes("exception");

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-t border-black text-gray-300">
      {/* Console Header */}
      <div className="flex gap-1 px-2 bg-[#252526] pt-2">
        <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-t-md bg-[#1e1e1e] text-blue-400 border-t-2 border-blue-500">
          <Terminal size={14} />
          Test Results
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
        <div className="h-full flex flex-col">
          <label className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Standard Output (stdout)</label>
          <div className={`w-full flex-grow bg-[#121212] border border-gray-700 rounded-md p-3 font-mono text-sm overflow-auto ${
            !output ? "text-gray-600 italic flex items-center justify-center" : 
            isError ? "text-red-400" : "text-green-400"
          }`}>
            {output ? (
              <pre className="whitespace-pre-wrap font-inherit">{output}</pre>
            ) : (
              "Compile and run your code to see the output here."
            )}
          </div>
        </div>
      </div>
    </div>
  );
}