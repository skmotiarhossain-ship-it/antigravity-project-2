import { useState } from "react";
import type { AppData } from "../store";
import { getBatchProgress } from "../store";
import { Activity, Search, Thermometer, Droplets, Wind, Cog } from "lucide-react";

interface Props {
  data: AppData;
}

export default function TrackPage({ data }: Props) {
  const [searchBatch, setSearchBatch] = useState("");
  const [activeBatch, setActiveBatch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchBatch.trim()) {
      setActiveBatch(searchBatch.trim().toUpperCase());
    }
  };

  const progress = activeBatch ? getBatchProgress(data, activeBatch) : null;
  const exists = progress && progress.steamed > 0;

  // Recent batches for quick selection
  const recentBatches = Array.from(new Set(data.processes.map(p => p.batchNo))).filter(Boolean).slice(0, 10);

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Batch Status Tracker
        </h2>
        <p className="text-xs text-slate-400 mt-1">Track the progress of any batch number</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchBatch}
            onChange={(e) => setSearchBatch(e.target.value.toUpperCase())}
            placeholder="Enter Batch No (e.g. MH...)"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 uppercase font-mono"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-sm font-medium transition-colors"
        >
          Track
        </button>
      </form>

      {/* Quick Select */}
      {recentBatches.length > 0 && !activeBatch && (
        <div className="flex-1 overflow-y-auto">
           <h3 className="text-sm font-medium text-slate-400 mb-3">Recent Batches</h3>
           <div className="flex flex-wrap gap-2">
             {recentBatches.map(b => (
               <button
                 key={b}
                 onClick={() => { setSearchBatch(b); setActiveBatch(b); }}
                 className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-mono hover:border-blue-500 hover:text-blue-400 transition-colors"
               >
                 {b}
               </button>
             ))}
           </div>
        </div>
      )}

      {/* Results */}
      {activeBatch && (
        <div className="flex-1 overflow-y-auto pb-6">
          {!exists ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
              <Activity className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-50" />
              <p className="text-slate-300 font-medium">Batch not found</p>
              <p className="text-slate-500 text-xs mt-1">Check the batch number and try again.</p>
            </div>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-6">
              <div className="border-b border-slate-700 pb-4 flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Batch Number</p>
                  <h3 className="text-xl font-bold font-mono text-green-400">{activeBatch}</h3>
                </div>
                <button 
                  onClick={() => { setActiveBatch(""); setSearchBatch(""); }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              </div>

              <div className="relative pl-6 space-y-6 border-l-2 border-slate-700">
                {/* Steaming */}
                <div className="relative">
                  <div className="absolute -left-[33px] top-1 w-6 h-6 rounded-full bg-slate-800 border-2 border-red-500 flex items-center justify-center z-10">
                    <Thermometer className="w-3 h-3 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Steaming</h4>
                    <p className="text-xs text-slate-400 mt-1">{progress!.steamed} bags processed</p>
                    {progress!.steamed - progress!.boiled > 0 && (
                      <span className="inline-block mt-2 text-xs font-medium bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
                        {progress!.steamed - progress!.boiled} bags pending boiling
                      </span>
                    )}
                  </div>
                </div>

                {/* Boiling */}
                <div className={`relative ${progress!.boiled === 0 ? 'opacity-40 grayscale' : ''}`}>
                  <div className={`absolute -left-[33px] top-1 w-6 h-6 rounded-full bg-slate-800 border-2 ${progress!.boiled > 0 ? 'border-blue-500' : 'border-slate-600'} flex items-center justify-center z-10`}>
                    <Droplets className={`w-3 h-3 ${progress!.boiled > 0 ? 'text-blue-500' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Boiling</h4>
                    <p className="text-xs text-slate-400 mt-1">{progress!.boiled} bags processed</p>
                    {progress!.boiled - progress!.dried > 0 && (
                      <span className="inline-block mt-2 text-xs font-medium bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                        {progress!.boiled - progress!.dried} bags pending drying
                      </span>
                    )}
                  </div>
                </div>

                {/* Drying */}
                <div className={`relative ${progress!.dried === 0 ? 'opacity-40 grayscale' : ''}`}>
                  <div className={`absolute -left-[33px] top-1 w-6 h-6 rounded-full bg-slate-800 border-2 ${progress!.dried > 0 ? 'border-yellow-500' : 'border-slate-600'} flex items-center justify-center z-10`}>
                    <Wind className={`w-3 h-3 ${progress!.dried > 0 ? 'text-yellow-500' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Drying</h4>
                    <p className="text-xs text-slate-400 mt-1">{progress!.dried} bags processed</p>
                    {progress!.dried - progress!.milled > 0 && (
                      <span className="inline-block mt-2 text-xs font-medium bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30">
                        {progress!.dried - progress!.milled} bags pending milling
                      </span>
                    )}
                  </div>
                </div>

                {/* Milling */}
                <div className={`relative ${progress!.milled === 0 ? 'opacity-40 grayscale' : ''}`}>
                  <div className={`absolute -left-[33px] top-1 w-6 h-6 rounded-full bg-slate-800 border-2 ${progress!.milled > 0 ? 'border-emerald-500' : 'border-slate-600'} flex items-center justify-center z-10`}>
                    <Cog className={`w-3 h-3 ${progress!.milled > 0 ? 'text-emerald-500' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Milling</h4>
                    <p className="text-xs text-slate-400 mt-1">{progress!.milled} bags processed</p>
                    {progress!.milled > 0 && (
                      <span className="inline-block mt-2 text-xs font-medium bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                        {progress!.milled} bags sent to godown
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
