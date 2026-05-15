import { useState, useRef, useEffect } from "react";

interface SearchableDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  onAddNew?: (val: string) => void;
  placeholder?: string;
}

export default function SearchableDropdown({
  label,
  options,
  value,
  onChange,
  onAddNew,
  placeholder = "Add or search...",
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setSearch("");
  };

  const handleAdd = () => {
    if (search.trim() && onAddNew) {
      onAddNew(search.trim());
      onChange(search.trim());
      setOpen(false);
      setSearch("");
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-sm text-left hover:border-green-500 focus:outline-none focus:border-green-500 transition-colors"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-500 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="font-semibold text-gray-800 mb-2 text-sm">{label}</div>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Add or search..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (filtered.length === 1) handleSelect(filtered[0]);
                  else if (filtered.length === 0 && search.trim()) handleAdd();
                }
              }}
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && search.trim() && (
              <button
                type="button"
                onClick={handleAdd}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-green-600 hover:bg-green-50 transition-colors"
              >
                <span className="text-lg font-bold">+</span>
                <span>Add "<strong>{search.trim()}</strong>"</span>
              </button>
            )}
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
              >
                <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  value === opt ? "border-green-500 bg-green-500" : "border-gray-300"
                }`}>
                  {value === opt && (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  )}
                </span>
                <span className={value === opt ? "text-green-700 font-medium" : "text-gray-700"}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 p-2 flex justify-end">
            <button
              type="button"
              onClick={() => { setOpen(false); setSearch(""); }}
              className="text-green-600 font-semibold text-sm px-4 py-1.5 hover:bg-green-50 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
