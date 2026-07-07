import React from "react";
import { TrendingUp, TrendingDown, Clock, ShieldAlert } from "lucide-react";

export default function StatCard({ label, value, sub, subType }) {
  const renderTrend = () => {
    switch (subType) {
      case "up":
        return (
          <div className="flex items-center gap-1 text-green-600 text-[10px] font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{sub}</span>
          </div>
        );
      case "down":
        return (
          <div className="flex items-center gap-1 text-red-600 text-[10px] font-bold">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{sub}</span>
          </div>
        );
      case "wait":
        return (
          <div className="flex items-center gap-1 text-orange-500 text-[10px] font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{sub}</span>
          </div>
        );
      case "alert":
        return (
          <div className="flex items-center gap-1 text-red-600 text-[10px] font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{sub}</span>
          </div>
        );
      default:
        return <span className="text-[#9a8a7a] text-[10px] font-medium">{sub}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e8ddd0] p-4 flex flex-col gap-1.5 shadow-sm transition-all hover:shadow-md">
      <span className="text-[10px] font-bold text-[#9a8a7a] uppercase tracking-widest">{label}</span>
      <span className={`text-2xl font-black ${value.color || "text-[#3a2a1a]"}`}>{value.text}</span>
      <div className="mt-1 flex items-center justify-between">{renderTrend()}</div>
    </div>
  );
}
