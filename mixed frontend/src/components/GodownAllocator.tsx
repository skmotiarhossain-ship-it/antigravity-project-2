import { useState } from "react";
import type { GodownAllocation } from "../store";

interface GodownAllocatorProps {
  godowns: string[];
  allocations: GodownAllocation[];
  onChange: (allocations: GodownAllocation[]) => void;
  onAddGodown?: (name: string) => void;
  godownLimits?: Record<string, number>;
}

export default function GodownAllocator({ godowns, allocations, onChange, onAddGodown, godownLimits }: GodownAllocatorProps) {
  const [showAddGodown, setShowAddGodown] = useState(false);
  const [newGodownName, setNewGodownName] = useState("");

  const totalBags = allocations.reduce((s, a) => s + a.bags, 0);

  const toggleGodown = (name: string) => {
    const existing = allocations.find((a) => a.godownName === name);
    if (existing) {
      onChange(allocations.filter((a) => a.godownName !== name));
    } else {
      onChange([...allocations, { godownName: name, bags: 0 }]);
    }
  };

  const updateBags = (name: string, bags: number) => {
    let newBags = Math.max(0, bags);
    if (godownLimits && godownLimits[name] !== undefined) {
      newBags = Math.min(newBags, godownLimits[name]);
    }
    onChange(allocations.map((a) => (a.godownName === name ? { ...a, bags: newBags } : a)));
  };

  const handleAddGodown = () => {
    if (newGodownName.trim() && onAddGodown) {
      onAddGodown(newGodownName.trim());
      setNewGodownName("");
      setShowAddGodown(false);
    }
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 font-medium">Select godowns &amp; enter bags</span>
        <button
          type="button"
          onClick={() => setShowAddGodown(!showAddGodown)}
          className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
        >
          <span>+</span> New Godown
        </button>
      </div>

      {showAddGodown && (
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newGodownName}
            onChange={(e) => setNewGodownName(e.target.value)}
            placeholder="Godown name..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
            onKeyDown={(e) => e.key === "Enter" && handleAddGodown()}
          />
          <button
            type="button"
            onClick={handleAddGodown}
            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setShowAddGodown(false); setNewGodownName(""); }}
            className="text-gray-500 px-2 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <div className="space-y-2">
        {godowns.map((godown) => {
          const alloc = allocations.find((a) => a.godownName === godown);
          const selected = !!alloc;
          return (
            <div key={godown} className={`border rounded-lg p-2 transition-colors ${selected ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleGodown(godown)}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    selected ? "border-green-500 bg-green-500" : "border-gray-300"
                  }`}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                </button>
                <span className="flex-1 text-sm font-medium text-gray-700">
                  {godown}
                  {godownLimits && godownLimits[godown] !== undefined && (
                    <span className="text-xs text-blue-600 ml-2">(Max: {godownLimits[godown]})</span>
                  )}
                </span>
                {selected && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateBags(godown, (alloc?.bags || 0) - 1)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded-lg text-gray-600 hover:bg-gray-300 transition-colors font-bold"
                    >—</button>
                    <input
                      type="number"
                      value={alloc?.bags || 0}
                      onChange={(e) => updateBags(godown, parseInt(e.target.value) || 0)}
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-green-500"
                      min={0}
                    />
                    <button
                      type="button"
                      onClick={() => updateBags(godown, (alloc?.bags || 0) + 1)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded-lg text-gray-600 hover:bg-gray-300 transition-colors font-bold"
                    >+</button>
                    <span className="text-xs text-gray-400 ml-1">bags</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allocations.length > 0 && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700 font-medium">Total allocated:</span>
            <span className="text-blue-800 font-bold">{totalBags} bags</span>
          </div>
          {allocations.map((a) => (
            <div key={a.godownName} className="flex justify-between text-xs text-blue-600 mt-0.5">
              <span>{a.godownName}</span>
              <span>{a.bags} bags</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
