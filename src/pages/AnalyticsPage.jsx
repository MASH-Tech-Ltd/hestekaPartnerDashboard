import React, { useState, useEffect } from "react";
import { useLang } from "../context/LanguageContext";
import { BarChart, Map, Target, Users, MapPin, Award } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from "../utils/api";

const AnalyticsCard = React.memo(({ label, value, color, icon: Icon, sub, subIcon: SubIcon }) => (
  <div className="bg-white rounded-2xl p-5 border border-[#e8ddd0] flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
    <div className={`absolute left-0 top-0 w-1.5 h-full ${color}`}></div>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] font-black text-[#9a8a7a] tracking-widest uppercase mb-1">{label}</p>
        <p className="text-3xl font-black text-[#3a2a1a] leading-none">{value}</p>
      </div>
      <div className={`p-2 rounded-xl ${color.replace('bg-', 'bg-').replace('600', '100')} ${color.replace('bg-', 'text-')}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="mt-4">
      <div className="text-[11px] font-bold text-[#9a8a7a] flex items-center gap-1.5">
        <div className="p-0.5 rounded-full bg-gray-100">
          {SubIcon ? <SubIcon className="w-3 h-3 text-[#3a2a1a]" /> : <BarChart className="w-3 h-3 text-[#3a2a1a]" />}
        </div>
        <span>{sub}</span>
      </div>
    </div>
  </div>
));

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#3a2a1a] text-white p-3 rounded-xl border border-white/20 shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black">{payload[0].value} Participants</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/user/get-partner-stats");
        if (res.data.status === "ok") {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch partner analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="text-[#9a8a7a] font-bold animate-pulse uppercase tracking-widest text-xs">
          {t.loadingLabel || "Loading performance data..."}
        </p>
      </div>
    );
  }

  const overview = data?.overview || {
    missions: { value: 0, active: 0 },
    collectionPoints: { value: 0, active: 0 },
    participants: { value: 0, completed: 0 }
  };

  const chartData = data?.participationsPerMonth || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnalyticsCard 
          label={t.missionsTitle || "Local Missions"} 
          value={overview.missions.value.toLocaleString()} 
          sub={`${overview.missions.active} ${t.activeLabel || "active"}`}
          color="bg-orange-600" 
          icon={Target}
          subIcon={Target}
        />
        <AnalyticsCard 
          label={t.collectionPointsTitle || "Collection Points"} 
          value={overview.collectionPoints.value.toLocaleString()} 
          sub={`${overview.collectionPoints.active} ${t.activeLabel || "active"}`}
          color="bg-green-600" 
          icon={MapPin}
          subIcon={Map}
        />
        <AnalyticsCard 
          label={t.totalParticipants || "Mission Participants"} 
          value={overview.participants.value.toLocaleString()} 
          sub={`${overview.participants.completed} ${t.completedLabel || "completed"}`}
          color="bg-blue-600" 
          icon={Users}
          subIcon={Award}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Participants Chart Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e8ddd0] p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-[#3a2a1a] text-sm flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart className="w-4 h-4 text-orange-600" />
              </div>
              {t.participationsMonth || "Participants per Month"}
            </h3>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#9a8a7a]">
                <div className="w-2 h-2 rounded-full bg-orange-600"></div> Registrations
              </span>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9a8a7a', fontSize: 10, fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9a8a7a', fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="participants" 
                  stroke="#ea580c" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorParticipants)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
