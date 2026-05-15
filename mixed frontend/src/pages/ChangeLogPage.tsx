import { useState } from "react";
import type { AppData } from "../store";
import { formatBengaliDate } from "../store";
import { History, Calendar, User, Eye, X } from 'lucide-react';

interface Props {
  data: AppData;
  onViewRecord: (page: string, record: any) => void;
}

export default function ChangeLogPage({ data, onViewRecord }: Props) {
  const today = new Date();

  // Helper to find the related record based on section and timestamp
  const findRelatedRecord = (log: any) => {
    const logTime = new Date(log.timestamp).getTime();
    const timeThreshold = 60000; // 1 minute window for matching

    if (log.section === "Purchase") {
      return data.purchases.find(p => Math.abs(new Date(p.createdAt).getTime() - logTime) < timeThreshold || log.details.includes(p.supplierName));
    }
    if (log.section === "Sales") {
      return data.sales.find(s => Math.abs(new Date(s.createdAt).getTime() - logTime) < timeThreshold || log.details.includes(s.customerName));
    }
    if (log.section.startsWith("Process")) {
      return data.processes.find(p => Math.abs(new Date(p.createdAt).getTime() - logTime) < timeThreshold || log.details.includes(p.batchNo));
    }
    if (log.section === "CashRegister") {
      return data.transactions.find(t => Math.abs(new Date(t.gregorianDate).getTime() - logTime) < timeThreshold);
    }
    if (log.section === "Profiles") {
      return data.profiles.find(p => log.details.includes(p.name));
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Activity Log</h2>
          <p className="text-slate-400 text-sm mt-1">Recent changes in the system</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-white text-sm font-medium">{formatBengaliDate(today)}</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        {data.changeLogs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-slate-300">No activity yet</p>
            <p className="text-sm mt-1">All system changes will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.changeLogs.map((log) => {
              const dt = new Date(log.timestamp);
              const timeStr = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

              const actionColor: Record<string, string> = {
                Added: "bg-green-600/20 text-green-400 border-green-600/30",
                Updated: "bg-blue-600/20 text-blue-400 border-blue-600/30",
                Deleted: "bg-red-600/20 text-red-400 border-red-600/30",
              };

              const moduleColors: Record<string, string> = {
                'Purchase': 'bg-blue-600/20 text-blue-400 border-blue-600/30',
                'Sales': 'bg-green-600/20 text-green-400 border-green-600/30',
                'Process/steaming': 'bg-purple-600/20 text-purple-400 border-purple-600/30',
                'Process/boiling': 'bg-purple-600/20 text-purple-400 border-purple-600/30',
                'Process/drying': 'bg-purple-600/20 text-purple-400 border-purple-600/30',
                'Process/milling': 'bg-purple-600/20 text-purple-400 border-purple-600/30',
              };

              const color = moduleColors[log.section] || actionColor[log.action] || 'bg-slate-600/20 text-slate-400 border-slate-600/30';
              const record = findRelatedRecord(log);

              return (
                <div 
                  key={log.id} 
                  onClick={() => {
                    if (record) {
                      onViewRecord(log.section.toLowerCase().replace('/', '-'), record);
                    } else {
                      alert("Record details are not available for this action (it may have been deleted).");
                    }
                  }}
                  className="flex items-start gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group"
                >
                  <div className={`px-2.5 py-1 rounded text-xs font-medium border ${color} shrink-0 w-24 text-center capitalize`}>
                    {log.section.replace('Process/', '') || log.action}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${actionColor[log.action] || "bg-slate-700 text-slate-300"}`}>
                          {log.action}
                        </span>
                        <p className="text-white text-sm font-medium">{log.details}</p>
                      </div>
                      <Eye className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-xs mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {log.user}
                      </span>
                      <span>•</span>
                      <span>{formatBengaliDate(dt)} at {timeStr}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
