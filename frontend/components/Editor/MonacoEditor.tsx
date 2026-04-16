"use client";
import { useRef, useState } from "react";
import Editor, { useMonaco, OnMount } from "@monaco-editor/react";
import { Copy, Check } from "lucide-react";

interface Props {
  code: string;
  onChange: (val: string | undefined) => void;
  language?: string;
  onRun?: () => void;
  onSubmit?: () => void;
}

export default function MonacoEditor({ code, onChange, language = "cpp", onRun, onSubmit }: Props) {
  const [copied, setCopied] = useState(false);
  const monaco = useMonaco();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Monaco Internal Keyboard Shortcuts ---
  // Intercepts keys natively within the editor before they bubble to the browser
  const handleEditorMount: OnMount = (editor, monaco) => {
    editor.onKeyDown((e: any) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      
      // Use e.browserEvent.key to be completely agnostic to physical keyboard layouts
      if (isCtrlOrCmd && e.browserEvent.key.toLowerCase() === 's') {
        e.preventDefault(); 
      }
      else if (isCtrlOrCmd && e.browserEvent.key === "'") {
        e.preventDefault();
        if (onRun) onRun();
      }
      else if (isCtrlOrCmd && e.browserEvent.key === 'Enter') {
        e.preventDefault();
        if (onSubmit) onSubmit();
      }
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {language === 'cpp' ? 'C++' : language}
          </span>
          <div className="flex gap-2 text-[10px] text-gray-600 font-mono">
            <span>Ctrl + ' to Run</span>
            <span>Ctrl + Enter to Submit</span>
          </div>
        </div>
        <button 
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          title="Copy Code"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Actual Editor */}
      <div className="flex-grow">
        <Editor
          height="100%"
          defaultLanguage={language}
          theme="vs-dark"
          value={code}
          onChange={onChange}
          onMount={handleEditorMount} // Inject the shortcut listener here
          loading={
            <div className="flex h-full items-center justify-center text-gray-500 font-mono text-sm">
              Loading Editor Engine...
            </div>
          }
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            cursorSmoothCaretAnimation: "on",
            padding: { top: 16 },
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontLigatures: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            wordWrap: "on",
            renderWhitespace: "selection",
          }}
        />
      </div>
    </div>
  );
}