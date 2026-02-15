
import React from 'react';
import { PrayerTimesData, PrayerCountdownState } from '../services/prayerTimeService';
import { formatTimeFromHHmm } from '../services/dateUtils';
import { Moon, Sun } from 'lucide-react';

interface PrayerTimesWidgetProps {
  times: PrayerTimesData | null;
  countdown: PrayerCountdownState | null;
}

const PrayerTimesWidget: React.FC<PrayerTimesWidgetProps> = ({ times, countdown }) => {
  if (!times || !countdown) {
    return (
      <div className="bg-white/40 rounded-[2rem] p-6 shadow-sm border border-white/50 animate-pulse h-48 w-full flex items-center justify-center">
         <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Format Display Time
  const formatDisplayTime = (t: string) => {
    return formatTimeFromHHmm(t, 'Asia/Dhaka');
  };

  const prayers = [
      { id: 'Fajr', label: 'ফজর শুরু', time: times.Fajr },
      { id: 'Sunrise', label: 'সূর্যোদয়', time: times.Sunrise, isSun: true },
      { id: 'Dhuhr', label: 'জুহর', time: times.Dhuhr },
      { id: 'Asr', label: 'আসর', time: times.Asr },
      { id: 'Maghrib', label: 'মাগরিব', time: times.Maghrib },
      { id: 'Isha', label: 'ইশা', time: times.Isha },
  ];

  return (
    <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-sm border border-white/60 relative overflow-hidden group hover:shadow-md transition-shadow duration-500">
        {/* Decorative Glows */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-100/40 to-transparent rounded-full blur-3xl"></div>

        {/* Special Sehri/Iftar Highlight Bar */}
        <div className="flex justify-between items-center mb-6 bg-emerald-50/80 rounded-2xl p-3 border border-emerald-100">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                    <Moon className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-[10px] uppercase text-indigo-500 font-bold tracking-wider">সেহরি শেষ</p>
                    <p className="text-lg font-bold font-mono text-indigo-900">{formatDisplayTime(times.Imsak)}</p>
                </div>
            </div>
            <div className="w-px h-8 bg-emerald-200"></div>
            <div className="flex items-center gap-3 text-right">
                <div>
                    <p className="text-[10px] uppercase text-orange-500 font-bold tracking-wider">ইফতার</p>
                    <p className="text-lg font-bold font-mono text-orange-900">{formatDisplayTime(times.Maghrib)}</p>
                </div>
                <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                    <Sun className="w-4 h-4" />
                </div>
            </div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            
            {/* Countdown Circle - Left */}
            <div className="flex flex-col items-center justify-center md:w-56 md:border-r md:border-gray-200 md:pr-8 shrink-0 order-1 md:order-1">
                <div className="relative w-40 h-40 md:w-48 md:h-48">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="50%" cy="50%" r="45%" className="stroke-gray-100 fill-none stroke-[6]" />
                        <circle
                            cx="50%" cy="50%" r="45%"
                            className={`fill-none stroke-[6] transition-all duration-1000 ease-linear drop-shadow-sm ${countdown.isForbidden ? 'stroke-red-400' : 'stroke-emerald-500'}`}
                            strokeDasharray="283"
                            strokeDashoffset={283 - (283 * countdown.percent) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                            {countdown.isForbidden ? 'নিষিদ্ধ সময়' : 'সময় বাকি'}
                        </span>
                        <span className="text-3xl sm:text-5xl md:text-4xl font-bold font-mono text-gray-800 tracking-tighter drop-shadow-sm">
                            {countdown.remainingText}
                        </span>
                        <span className="text-[10px] md:text-xs font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full mt-2 border border-emerald-200/50 backdrop-blur-sm shadow-sm text-center max-w-[90%] truncate">
                            {countdown.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Prayer List - Right */}
            <div className="w-full md:flex-1 grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-2 order-2 md:order-2">
                {prayers.map((p) => {
                    const isNext = countdown.nextWaqtName === p.id;
                    const isCurrent = countdown.currentWaqtName === p.id;
                    // Fix: Fajr Start vs Sunrise logic for visual selection
                    const isActive = isCurrent || (p.id === 'Fajr' && countdown.currentWaqtName === 'Imsak'); 

                    return (
                        <div key={p.id} className={`
                            flex items-center justify-between p-2 md:p-3 rounded-xl transition-all
                            ${isCurrent ? 'bg-emerald-100/50 border border-emerald-200' : isNext ? 'bg-amber-50 border border-amber-100' : 'hover:bg-white/50 border border-transparent'}
                        `}>
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-emerald-500 animate-pulse' : isNext ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                                <span className={`text-sm md:text-base font-medium ${p.isSun ? 'text-gray-400 text-xs' : 'text-gray-700'}`}>{p.label}</span>
                            </div>
                            <span className={`font-mono font-bold ${p.isSun ? 'text-gray-400 text-xs' : 'text-gray-800 md:text-lg'}`}>
                                {formatDisplayTime(p.time)}
                            </span>
                        </div>
                    );
                })}
            </div>

        </div>
    </div>
  );
};

export default PrayerTimesWidget;
