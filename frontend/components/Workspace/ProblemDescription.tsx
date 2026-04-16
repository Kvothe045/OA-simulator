"use client";

interface Props {
  content?: string;
  title?: string;
  difficulty?: string;
  url?: string; // Add this prop
}

export default function ProblemDescription({ content, title, difficulty, url }: Props) {
  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title || "Loading..."}</h1>
          {url && (
             <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline mt-1 block w-fit">
               {url}
             </a>
          )}
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          difficulty === "Easy" ? "text-green-500 bg-green-500/10" :
          difficulty === "Medium" ? "text-yellow-500 bg-yellow-500/10" : "text-red-500 bg-red-500/10"
        }`}>
          {difficulty}
        </span>
      </div>
      
      <div 
        className="prose prose-invert prose-pre:bg-[#1e1e1e] max-w-none text-gray-300"
        dangerouslySetInnerHTML={{ __html: content || "" }} 
      />
    </div>
  );
}