
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
import { DailyLog, PrayerStatus, UserSettings } from '../types';
import { getDailyLog, saveDailyLog, getRecentLogs } from '../services/storage';
import { getFormattedDate, detectDayMode, getHijriDate, getDateKeyInTimeZone } from '../services/dateUtils';
import { getDailyInsight, getConsistencyAnalysis } from '../services/geminiService';
import { loadDay, listenDay, saveDay } from '../services/firestore';
import { fetchPrayerTimes, calculatePrayerCountdown, PrayerTimesData, englishToBanglaDigits } from '../services/prayerTimeService';
import { build15DayReport } from '../services/reporting';
import { districts } from '../data/districts';
import { getServerClockOffsetMs, getSyncedNow } from '../services/clock';
import PrayerItem from './PrayerItem';
import Settings from './Settings';
import PrayerTimesWidget from './PrayerTimesWidget';
import CalendarView from './CalendarView';
import { Settings as SettingsIcon, LogOut, CheckCheck, Sparkles, Calendar, BookOpen, Moon, Sun, BookMarked, Trophy, X, BrainCircuit, Home, UserCircle, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

interface DashboardProps {
  user: User | null;
  isGuest: boolean;
  settings: UserSettings;
  onUpdateSettings: (s: UserSettings) => void;
  onLogout: () => void;
}

type TabView = 'today' | 'calendar' | 'dashboard' | 'settings';

const Dashboard: React.FC<DashboardProps> = ({ user, isGuest, settings, onUpdateSettings, onLogout }) => {
  const timeZone = 'Asia/Dhaka';
  const [currentDate, setCurrentDate] = useState(() => getSyncedNow());
  const [now, setNow] = useState(() => getSyncedNow());
  const clockOffsetRef = useRef(0);
  const [activeTab, setActiveTab] = useState<TabView>('today');
  
  // Data States
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [times, setTimes] = useState<PrayerTimesData | null>(null);
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  // UI States
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isDoneAnimating, setIsDoneAnimating] = useState(false);
  const reportRecords = useMemo(() => {
    const logs = getRecentLogs(45);
    if (dailyLog && !logs.some(log => log.date === dailyLog.date)) {
      return [...logs, dailyLog];
    }
    return logs;
  }, [dailyLog]);
  const report = useMemo(() => build15DayReport(reportRecords, timeZone), [reportRecords, timeZone]);

  // --- 1. Data Loading Logic ---

  useEffect(() => {
    const loadTimes = async () => {
      const data = await fetchPrayerTimes(settings.district, currentDate, settings.calculationMethod, settings.madhhab);
      setTimes(data);
    };
    loadTimes();
  }, [settings.district, settings.calculationMethod, settings.madhhab, currentDate]);

  useEffect(() => {
    let isMounted = true;

    const refreshNow = (offsetMs: number = clockOffsetRef.current) => {
      const syncedNow = getSyncedNow(offsetMs);
      setNow(syncedNow);
      setCurrentDate((previousDate) =>
        getDateKeyInTimeZone(syncedNow, timeZone) !== getDateKeyInTimeZone(previousDate, timeZone)
          ? syncedNow
          : previousDate
      );
    };

    const syncClock = async () => {
      const offset = await getServerClockOffsetMs();
      if (!isMounted || offset == null) return;
      clockOffsetRef.current = offset;
      refreshNow(offset);
    };

    const handleForeground = () => {
      if (document.hidden) return;
      refreshNow();
      void syncClock();
    };

    refreshNow();
    void syncClock();
    const reSyncTimer = setInterval(() => {
      void syncClock();
    }, 5 * 60 * 1000);

    document.addEventListener('visibilitychange', handleForeground);
    window.addEventListener('focus', handleForeground);
    window.addEventListener('pageshow', handleForeground);

    return () => {
      isMounted = false;
      clearInterval(reSyncTimer);
      document.removeEventListener('visibilitychange', handleForeground);
      window.removeEventListener('focus', handleForeground);
      window.removeEventListener('pageshow', handleForeground);
    };
  }, [timeZone]);

  useEffect(() => {
    const t = setInterval(() => {
      const d = getSyncedNow(clockOffsetRef.current);
      setNow(d);
      // Keep date-based data in sync when the day changes in the selected timezone.
      setCurrentDate((previousDate) =>
        getDateKeyInTimeZone(d, timeZone) !== getDateKeyInTimeZone(previousDate, timeZone)
          ? d
          : previousDate
      );
    }, 1000);
    return () => clearInterval(t);
  }, [timeZone]);

  const countdown = useMemo(() => {
    if (!times) return null;
    return calculatePrayerCountdown(times, now);
  }, [times, now]);

  useEffect(() => {
    const mode = detectDayMode(currentDate, settings, timeZone);
    const hijriDate = getHijriDate(currentDate, settings.moonSightingOffset, timeZone);
    const dateKey = getDateKeyInTimeZone(currentDate, timeZone);

    const recentLogs = getRecentLogs(5);
    const userName = user?.displayName || (isGuest ? 'Guest' : 'User');
    setLoadingInsight(true);
    getDailyInsight(mode, hijriDate, recentLogs, userName).then(text => {
        setInsight(text);
        setLoadingInsight(false);
    });

    const localLog = getDailyLog(currentDate, mode, timeZone);
    setDailyLog(localLog);

    if (user && !isGuest) {
        loadDay(user.uid, dateKey).then((cloudData) => {
            if (cloudData) {
                const mergedLog = { ...localLog, ...cloudData };
                setDailyLog(mergedLog);
                saveDailyLog(mergedLog);
            } else {
                saveDay(user.uid, dateKey, localLog);
            }
        });
        const unsubscribe = listenDay(user.uid, dateKey, (realtimeData) => {
            if (realtimeData) {
                 setDailyLog(prev => ({ ...prev || localLog, ...realtimeData }));
            }
        });
        return () => unsubscribe();
    }
  }, [currentDate, settings, timeZone, user, isGuest]);

  // --- 2. Action Handlers ---

  const persistLog = (newLog: DailyLog) => {
      setDailyLog(newLog);
      saveDailyLog(newLog);
      if (user && !isGuest) saveDay(user.uid, newLog.date, newLog);
  };

  const handlePrayerUpdate = (id: string, status: PrayerStatus, note?: string) => {
    if (!dailyLog) return;
    const updatedPrayers = dailyLog.prayers.map(p => 
      p.id === id ? { ...p, status, note, completedAt: status === 'done' ? Date.now() : undefined } : p
    );
    persistLog({ ...dailyLog, prayers: updatedPrayers });
  };

  const markAllFarzDone = () => {
    if (!dailyLog) return;
    setIsDoneAnimating(true);
    setTimeout(() => setIsDoneAnimating(false), 1000);
    const updatedPrayers = dailyLog.prayers.map(p => {
      if (p.isFarz && !p.isEid) return { ...p, status: 'done' as PrayerStatus, completedAt: Date.now() };
      return p;
    });
    persistLog({ ...dailyLog, prayers: updatedPrayers });
  };

  const toggleAmol = (key: keyof typeof dailyLog.amols) => {
    if (!dailyLog) return;
    persistLog({ 
        ...dailyLog, 
        amols: { ...dailyLog.amols, [key]: !dailyLog.amols[key] } 
    });
  };

  const handleAnalyze = async () => {
    const recentLogs = getRecentLogs(7);
    const userName = user?.displayName || (isGuest ? 'Guest' : 'User');
    const text = await getConsistencyAnalysis(recentLogs, userName);
    setAnalysisText(text);
  };

  // --- 3. UI Helpers ---

  const districtName = districts.find(d => d.id === settings.district)?.nameBn || 'ঢাকা';
  const hijri = getHijriDate(currentDate, settings.moonSightingOffset, timeZone);
  const farzPrayersList = dailyLog?.prayers.filter(p => p.isFarz) || [];
  const totalPrayers = farzPrayersList.length || 0;
  const completedPrayers = farzPrayersList.filter(p => p.status === 'done').length || 0;
  const progress = totalPrayers > 0 ? (completedPrayers / totalPrayers) * 100 : 0;
  
  const currentWaqtId = useMemo(() => {
      if(!countdown?.currentWaqtName) return null;
      const map: Record<string, string> = { 'Fajr': 'fajr', 'Dhuhr': 'dhuhr', 'Asr': 'asr', 'Maghrib': 'maghrib', 'Isha': 'isha' };
      return map[countdown.currentWaqtName] || null;
  }, [countdown]);

  const NowBar = () => (
    <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-5 py-3 rounded-3xl shadow-lg shadow-emerald-900/10 flex items-center justify-between mb-6 mx-1 animate-in slide-in-from-top-2 z-20 sticky top-4 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${countdown?.isForbidden ? 'bg-red-500 animate-pulse' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'}`}></div>
            <div>
                <p className="text-[10px] text-emerald-200/80 font-bold uppercase tracking-wider">
                    {countdown?.isForbidden ? 'নিষিদ্ধ সময়' : 'এখন চলছে'}
                </p>
                <p className="text-sm font-bold leading-none mt-0.5">
                    {countdown?.currentWaqtName === 'Ishraq/Chasht' ? 'চাশত / ইশরাক' : 
                     dailyLog?.prayers.find(p => p.id === currentWaqtId)?.label || 'নামাজের বিরতি'}
                </p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-[10px] text-emerald-200/80 font-bold uppercase tracking-wider">বাকি আছে</p>
            <p className="text-sm font-mono font-bold leading-none mt-0.5">{countdown?.remainingText}</p>
        </div>
    </div>
  );

  const BarChart: React.FC<{ labels: string[]; data: number[] }> = ({ labels, data }) => {
    const maxValue = Math.max(1, ...data);
    return (
      <div className="w-full">
        <div className="flex items-end gap-1 h-24">
          {data.map((value, idx) => (
            <div key={`${labels[idx]}-${idx}`} className="flex-1 flex items-end">
              <div
                className="w-full rounded-md bg-emerald-400/80"
                style={{ height: `${Math.round((value / maxValue) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-gray-500 font-medium">
          {labels.map((label, idx) => (
            <span key={`${label}-${idx}`} className="flex-1 text-center leading-none">
              {englishToBanglaDigits(label)}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const PieChart: React.FC<{ labels: string[]; data: number[] }> = ({ labels, data }) => {
    const total = data.reduce((sum, val) => sum + val, 0);
    const colors = ['#10b981', '#f59e0b', '#ef4444'];
    let start = 0;
    const segments = data.map((value, idx) => {
      const percent = total > 0 ? (value / total) * 100 : 0;
      const seg = `${colors[idx % colors.length]} ${start}% ${start + percent}%`;
      start += percent;
      return seg;
    });
    return (
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full shrink-0"
          style={{ background: `conic-gradient(${segments.join(', ')})` }}
          aria-label="distribution chart"
        />
        <div className="flex-1 space-y-1 text-xs text-gray-600">
          {labels.map((label, idx) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                <span>{label}</span>
              </div>
              <span className="font-semibold text-gray-700">{englishToBanglaDigits(String(data[idx] ?? 0))}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CollapsibleHeader = () => (
    <div className="mb-4 px-2 flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 font-serif leading-tight">
                {getFormattedDate(currentDate, timeZone)}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold mt-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{englishToBanglaDigits(hijri.day)} {hijri.monthName}, {englishToBanglaDigits(hijri.year)}</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span className="bg-white/50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-100/50 backdrop-blur-sm shadow-sm">{districtName}</span>
            </div>
        </div>
        <div 
            onClick={() => setShowSettings(true)}
            className="w-11 h-11 bg-white/70 backdrop-blur-xl rounded-full shadow-sm border border-emerald-50 flex items-center justify-center text-emerald-700 active:scale-90 transition-all cursor-pointer hover:bg-white hover:shadow-md hover:text-emerald-900 group"
        >
             <SettingsIcon className="w-6 h-6 group-hover:rotate-45 transition-transform duration-500" />
        </div>
    </div>
  );

  // --- Main Render ---

  return (
    <div className="w-full max-w-md md:max-w-6xl mx-auto min-h-screen pb-24 md:pb-0 relative">
        
        {/* Main Content Area */}
        <div className="p-4 md:p-6 space-y-5">
            <CollapsibleHeader />

            {/* View Switcher Logic */}
            {activeTab === 'today' && (
                <>
                    <NowBar />
                    <div className="md:grid md:grid-cols-12 md:gap-8">
                        {/* 
                           Layout Swap: 
                           Widgets (Countdown) -> Left (md:order-1) 
                           Tracker (Selections) -> Right (md:order-2)
                        */}

                        {/* Tracker Col (Right) */}
                        <div className="md:col-span-7 space-y-6 order-2 md:order-2">
                            {/* Progress */}
                            <div className="bg-white/50 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center justify-between border border-white/60 shadow-sm">
                                <span className="text-xs font-bold text-gray-600">আজকের নামাজের অগ্রগতি</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2.5 bg-gray-200/50 rounded-full overflow-hidden border border-white/20">
                                        <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100/50 px-2 py-0.5 rounded-md">{Math.round(progress)}%</span>
                                </div>
                            </div>

                            {/* Prayer List */}
                            <div className="space-y-3">
                                {dailyLog?.prayers.map((prayer) => (
                                    <PrayerItem 
                                        key={prayer.id} 
                                        prayer={prayer} 
                                        isActive={prayer.id === currentWaqtId}
                                        onUpdate={handlePrayerUpdate} 
                                    />
                                ))}
                            </div>

                            {/* Amol Section */}
                            <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/40 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-300/10 rounded-full blur-2xl"></div>
                                
                                <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2 relative z-10">
                                    <BookOpen className="w-4 h-4 text-emerald-600" />
                                    কুরআন ও আমল
                                </h3>
                                
                                {/* Quran Counter */}
                                <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-2xl p-4 border border-emerald-100/30 flex justify-between items-center shadow-sm mb-4 relative z-10">
                                    <span className="text-sm font-medium text-gray-700">আজকের তিলাওয়াত</span>
                                    <div className="flex items-center gap-3 bg-white/60 rounded-xl p-1 shadow-sm border border-white/50">
                                        <button onClick={() => { if(dailyLog) persistLog({ ...dailyLog, quranAyahs: Math.max(0, (dailyLog.quranAyahs||0)-1) }) }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors">-</button>
                                        <span className="font-mono font-bold text-lg text-emerald-800 min-w-[2ch] text-center">{dailyLog?.quranAyahs || 0}</span>
                                        <button onClick={() => { if(dailyLog) persistLog({ ...dailyLog, quranAyahs: (dailyLog.quranAyahs||0)+1 }) }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-emerald-100 text-gray-500 hover:text-emerald-600 transition-colors">+</button>
                                    </div>
                                </div>

                                {/* Amol Cards */}
                                <div className="space-y-2 relative z-10">
                                    {[
                                        { key: 'threeQuls', label: '৩ কুল', sub: '(সকাল/সন্ধ্যা)', icon: Sun, color: 'text-amber-500' },
                                        { key: 'surahWakiah', label: 'সূরা ওয়াকিয়া', sub: '(মাগরিবের পরে)', icon: BookOpen, color: 'text-indigo-500' },
                                        { key: 'surahMulk', label: 'সূরা মুলক', sub: '(ঘুমানোর আগে)', icon: Moon, color: 'text-slate-600' },
                                        { key: 'surahBaqarahLast2', label: 'সূরা বাকারা (শেষ ২)', sub: '(রাতে)', icon: BookMarked, color: 'text-emerald-600' },
                                    ].map((item) => {
                                        const isChecked = dailyLog?.amols?.[item.key as keyof typeof dailyLog.amols];
                                        return (
                                            <button 
                                                key={item.key}
                                                onClick={() => toggleAmol(item.key as keyof typeof dailyLog.amols)}
                                                className={`
                                                    w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group
                                                    ${isChecked 
                                                        ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                                                        : 'bg-white/40 border-transparent hover:bg-white/80 hover:border-gray-100 hover:shadow-sm'}
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${isChecked ? 'bg-white' : 'bg-gray-100'} transition-colors`}>
                                                        <item.icon className={`w-5 h-5 ${isChecked ? item.color : 'text-gray-400'}`} />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className={`block text-sm font-bold ${isChecked ? 'text-gray-800' : 'text-gray-600'}`}>{item.label}</span>
                                                        <span className="text-[10px] text-gray-400">{item.sub}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-medium ${isChecked ? 'text-emerald-600' : 'text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                                                        {isChecked ? 'সম্পন্ন' : 'মার্ক করুন'}
                                                    </span>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                                                        {isChecked && <CheckCheck className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Logout Button */}
                            <div className="pt-4 pb-8 md:pb-0 text-center">
                                <button 
                                    onClick={onLogout}
                                    className="text-red-500/60 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 mx-auto"
                                >
                                    <LogOut className="w-3 h-3" />
                                    {isGuest ? 'গেস্ট মোড থেকে বের হন' : 'লগ আউট'}
                                </button>
                            </div>
                        </div>

                        {/* Widgets Col (Left) */}
                        <div className="md:col-span-5 space-y-6 order-1 md:order-1">
                            <PrayerTimesWidget times={times} countdown={countdown} />
                            
                            {/* Insight Card */}
                            <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-xl rounded-[2rem] p-6 border border-indigo-100/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-500">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-200/30 rounded-full blur-xl group-hover:bg-indigo-300/30 transition-colors"></div>
                                <Sparkles className="w-5 h-5 text-indigo-500 absolute top-6 right-6 animate-pulse" />
                                <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-indigo-300"></span>
                                    আজকের পাথেয়
                                </h4>
                                {loadingInsight ? (
                                    <div className="space-y-2">
                                        <div className="h-4 bg-indigo-100/50 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-4 bg-indigo-100/50 rounded w-1/2 animate-pulse"></div>
                                    </div>
                                ) : (
                                    <p className="text-[15px] font-serif text-indigo-950 italic leading-relaxed text-opacity-90">
                                        "{insight}"
                                    </p>
                                )}
                            </div>

                            {/* Desktop Report Button */}
                            <button 
                                onClick={() => setShowSummary(true)}
                                className="hidden md:flex w-full bg-white/60 backdrop-blur-xl border border-white/50 p-4 rounded-[2rem] items-center justify-between group hover:bg-white hover:shadow-md transition-all cursor-pointer shadow-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full flex items-center justify-center shadow-sm">
                                        <Trophy className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-gray-800 text-base">রিপোর্ট ও বিশ্লেষণ</h4>
                                        <p className="text-xs text-gray-500 font-medium">সাপ্তাহিক আমল ও AI পরামর্শ দেখুন</p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" />
                                </div>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Calendar View */}
            {activeTab === 'calendar' && (
                <div className="animate-in fade-in slide-in-from-right-4">
                    <CalendarView
                        districtId={settings.district}
                        calculationMethod={settings.calculationMethod}
                        madhhab={settings.madhhab}
                        onClose={() => setActiveTab('today')}
                    />
                </div>
            )}
        </div>

        {/* Sticky Mobile Action Bar */}
        {activeTab === 'today' && (
            <div className="md:hidden fixed bottom-20 left-4 right-4 z-40 flex gap-3">
                <button 
                    onClick={markAllFarzDone}
                    className={`flex-1 backdrop-blur-xl border shadow-lg rounded-2xl py-4 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all
                    ${isDoneAnimating 
                        ? 'bg-emerald-500 text-white border-emerald-500' 
                        : 'bg-white/90 text-emerald-900 border-white/50 shadow-emerald-900/10'
                    }
                    `}
                >
                    <CheckCheck className={`w-4 h-4 ${isDoneAnimating ? 'animate-spin' : ''}`} /> 
                    {isDoneAnimating ? 'সম্পন্ন হচ্ছে...' : 'সব ফরজ সম্পন্ন'}
                </button>
                <button 
                    onClick={() => setShowSummary(true)}
                    className="flex-none w-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                    <Trophy className="w-5 h-5 text-yellow-400" />
                </button>
            </div>
        )}

        {/* Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] pb-safe z-50">
            <div className="flex justify-around items-center h-16">
                <button onClick={() => setActiveTab('today')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'today' ? 'text-emerald-700' : 'text-gray-400'}`}>
                    <Home className={`w-6 h-6 ${activeTab === 'today' ? 'fill-emerald-100' : ''}`} />
                    <span className="text-[10px] font-bold">আজ</span>
                </button>
                <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'calendar' ? 'text-emerald-700' : 'text-gray-400'}`}>
                    <Calendar className={`w-6 h-6 ${activeTab === 'calendar' ? 'fill-emerald-100' : ''}`} />
                    <span className="text-[10px] font-medium">ক্যালেন্ডার</span>
                </button>
                <button onClick={() => setShowSettings(true)} className="flex flex-col items-center gap-1 w-16 text-gray-400 hover:text-gray-600 transition-colors">
                    <SettingsIcon className="w-6 h-6" />
                    <span className="text-[10px] font-medium">সেটিংস</span>
                </button>
            </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in">
                <div className="absolute inset-0" onClick={() => setShowSettings(false)} />
                <div className="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden max-h-[85vh] animate-in slide-in-from-bottom-10 sm:m-4 relative">
                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2 sm:hidden"></div>
                    <div className="overflow-y-auto h-full max-h-[80vh] p-1">
                        <Settings currentSettings={settings} onSave={onUpdateSettings} onClose={() => setShowSettings(false)} />
                    </div>
                </div>
            </div>
        )}

        {/* Summary Modal */}
        {showSummary && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-md animate-in fade-in">
                <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl relative border border-white/50">
                    <button onClick={() => setShowSummary(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X className="w-5 h-5 text-gray-600" /></button>
                    <div className="text-center mt-2">
                        <div className="w-20 h-20 bg-gradient-to-tr from-yellow-300 to-amber-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 animate-in zoom-in duration-500">
                            <Trophy className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 font-serif">আজকের রিপোর্ট</h2>
                        <p className="text-gray-500 text-sm mb-6">{getFormattedDate(currentDate, timeZone)}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-100">
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">নামাজ</p>
                                <p className="text-3xl font-bold text-emerald-800">{completedPrayers}<span className="text-lg text-emerald-600/50">/{totalPrayers}</span></p>
                            </div>
                             <div className="bg-blue-50/80 p-5 rounded-2xl border border-blue-100">
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">কুরআন</p>
                                <p className="text-3xl font-bold text-blue-800">{dailyLog?.quranAyahs} <span className="text-sm font-normal text-blue-600/50">আয়াত</span></p>
                            </div>
                        </div>

                        {!analysisText ? (
                            !loadingAnalysis ? (
                                <button onClick={() => { setLoadingAnalysis(true); handleAnalyze().finally(() => setLoadingAnalysis(false)); }} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-colors">
                                    <BrainCircuit className="w-4 h-4" /> AI বিশ্লেষণ দেখুন
                                </button>
                            ) : (
                                <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 animate-pulse">
                                    <div className="relative">
                                         <BrainCircuit className="w-5 h-5 animate-pulse text-emerald-500" />
                                         <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                         </span>
                                    </div>
                                    আপনার ডেটা বিশ্লেষণ করা হচ্ছে...
                                </div>
                            )
                        ) : (
                            <>
                                <div className="bg-gray-50/80 p-5 rounded-2xl text-left text-sm text-gray-700 leading-relaxed max-h-48 overflow-y-auto border border-gray-100">
                                    {analysisText}
                                </div>
                                <div className="mt-4 bg-gray-50/80 p-5 rounded-2xl text-left text-sm text-gray-700 border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3">Last 15 Days</h3>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-white/80 p-3 rounded-xl border border-gray-100">
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Completion</p>
                                            <p className="text-xl font-bold text-emerald-800">
                                                {englishToBanglaDigits(String(Math.round(report.summary.completionRate)))}%
                                            </p>
                                        </div>
                                        <div className="bg-white/80 p-3 rounded-xl border border-gray-100">
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Completed</p>
                                            <p className="text-xl font-bold text-emerald-800">
                                                {englishToBanglaDigits(String(report.summary.totalCompleted))}/{englishToBanglaDigits(String(report.summary.totalItems))}
                                            </p>
                                        </div>
                                        <div className="bg-white/80 p-3 rounded-xl border border-gray-100">
                                            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-1">Missed</p>
                                            <p className="text-xl font-bold text-orange-700">
                                                {englishToBanglaDigits(String(report.summary.missed))}
                                            </p>
                                        </div>
                                        <div className="bg-white/80 p-3 rounded-xl border border-gray-100">
                                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Streak</p>
                                            <p className="text-xl font-bold text-blue-700">
                                                {englishToBanglaDigits(String(report.summary.streak ?? 0))}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white/80 p-3 rounded-xl border border-gray-100 mb-4">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Completed per Day</p>
                                        <BarChart labels={report.barChart.labels} data={report.barChart.data} />
                                    </div>
                                    <div className="bg-white/80 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Distribution</p>
                                        <PieChart labels={report.pieChart.labels} data={report.pieChart.data} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
             </div>
        )}

    </div>
  );
};

export default Dashboard;
