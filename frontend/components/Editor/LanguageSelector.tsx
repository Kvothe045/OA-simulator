"use client";

const LANGUAGES = [
  { label: "C++", value: "cpp" },
  { label: "Java", value: "java" },
  { label: "Python3", value: "python3" },
];

export default function LanguageSelector({ selected, onSelect }: any) {
  return (
    <select 
      value={selected} 
      onChange={(e) => onSelect(e.target.value)}
      className="bg-[#1e1e1e] text-gray-300 text-xs font-bold px-2 py-1 rounded border border-gray-700 outline-none hover:bg-gray-700 transition-colors"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.value} value={lang.value}>{lang.label}</option>
      ))}
    </select>
  );
}