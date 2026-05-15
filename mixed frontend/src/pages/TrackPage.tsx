import { useState } from "react";
import type { AppData, ProcessRecord } from "../store";
import { Search, Package, MapPin, CheckCircle, Clock, Eye, AlertTriangle } from 'lucide-react';

interface Props {
  data: AppData;
  onViewRecord: (page: string, record: any) => void;
}

export default function TrackPage({ data, onViewRecord }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  // Get all unique batches from steaming records
  const steamingRecords = data.processes.filter(p => p.processType === 'steaming');
  
  // Filter by search
  const filteredBatches = steamingRecords
    .filter(rec => rec.batchNo.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());

  // Show top 4 if no search query
  const displayBatches = searchQuery ? filteredBatches : filteredBatches.slice(0, 4);

  const getProcessRecord = (batchNo: string, type: "steaming" | "boiling" | "drying" | "milling") => {
    return data.processes.find(p => p.batchNo === batchNo && p.processType === type);
  };

  const getCustomerNames = (millingGodown: string, riceType: string) => {
    const sales = data.sales.filter(s => 
      s.type === riceType && 
      s.godownAllocations.some(a => a.godownName === millingGodown)
    );
    if (sales.length === 0) return "Not Sold Yet";
    const uniqueCustomers = Array.from(new Set(sales.map(s => s.customerName)));
    return uniqueCustomers.join(", ");
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="p-6 shrink-0 bg-slate-900">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
          <MapPin className="w-6 h-6 text-emerald-400" />
          Status & Tracking
        </h2>

        <div className="relative max-w-xl mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Batch Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-500"
          />
        </div>

        {searchQuery === "" && (
          <p className="text-sm text-slate-400 mb-4 font-medium uppercase tracking-wider">Recent Batches</p>
        )}

        <div className="space-y-6 pb-20">
          {displayBatches.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No batches found.</p>
            </div>
          ) : (
            displayBatches.map(batch => {
              const steaming = batch;
              const boiling = getProcessRecord(batch.batchNo, "boiling");
              const drying = getProcessRecord(batch.batchNo, "drying");
              const milling = getProcessRecord(batch.batchNo, "milling");

              const steps = [
                { id: "steaming", label: "Steaming", record: steaming },
                { id: "boiling", label: "Boiling", record: boiling },
                { id: "drying", label: "Drying", record: drying },
                { id: "milling", label: "Milling", record: milling },
              ];

              const currentStage = steps.slice().reverse().find(s => s.record)?.label || "Initiated";
              const isComplete = !!milling;

              return (
                <div key={batch.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                  <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-emerald-400 font-mono">{batch.batchNo}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${isComplete ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'}`}>
                          {isComplete ? 'Completed' : `At ${currentStage}`}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">
                        <span className="text-slate-500">Supplier:</span> {batch.supplierName || "—"} &bull; <span className="text-slate-500">Type:</span> {batch.riceType || "—"}
                      </p>
                      {milling && (
                         <p className="text-sm text-slate-300 mt-1">
                           <span className="text-slate-500">Customers:</span> {getCustomerNames(milling.godownName || "", batch.riceType || "")}
                         </p>
                      )}
                    </div>
                    <div className="text-right">
                       <p className="text-sm text-slate-400">Started on {batch.date}</p>
                       <p className="text-xl font-bold text-white mt-1">{batch.totalBags} <span className="text-sm text-slate-500 font-normal">bags</span></p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="relative">
                      {/* Vertical line connecting steps on desktop, hidden on very small screens if needed, but flex-col makes it vertical */}
                      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-700 hidden sm:block"></div>
                      
                      <div className="space-y-6 relative">
                        {steps.map((step, index) => {
                          const isDone = !!step.record;
                          return (
                            <div key={step.id} className="flex items-start gap-4">
                              <div className="relative z-10 hidden sm:flex shrink-0 w-8 h-8 rounded-full bg-slate-800 border-2 items-center justify-center mt-1"
                                   style={{ borderColor: isDone ? '#34d399' : '#334155' }}>
                                {isDone ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Clock className="w-4 h-4 text-slate-500" />}
                              </div>
                              
                              <div className={`flex-1 p-4 rounded-lg border ${isDone ? 'bg-slate-800/80 border-slate-600' : 'bg-slate-900/50 border-slate-800'} transition-colors`}>
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div>
                                    <h4 className={`font-medium ${isDone ? 'text-white' : 'text-slate-500'}`}>{step.label}</h4>
                                    {isDone && step.record && (
                                      <p className="text-xs text-slate-400 mt-1">{step.record.date} &bull; {step.record.totalBags} bags processed</p>
                                    )}
                                    {!isDone && (
                                      <p className="text-xs text-slate-500 mt-1">Pending</p>
                                    )}
                                  </div>
                                  
                                  {isDone && step.record && (
                                    <button 
                                      onClick={() => onViewRecord(`process-${step.id}`, step.record)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 transition-colors text-sm font-medium border border-blue-500/20"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Details
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
