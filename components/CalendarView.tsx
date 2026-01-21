
import React, { useState, useEffect } from 'react';
import { fetchMonthlyPrayerTimes, PrayerTimesData, englishToBanglaDigits } from '../services/prayerTimeService';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, X } from 'lucide-react';

interface CalendarViewProps {
    districtId: string;
    onClose?: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ districtId, onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [days, setDays] = useState<PrayerTimesData[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDay, setSelectedDay] = useState<PrayerTimesData | null>(null);

    const loadMonthData = async () => {
        setLoading(true);
        const m = currentDate.getMonth() + 1;
        const y = currentDate.getFullYear();
        // Now synchronous and local
        const data = await fetchMonthlyPrayerTimes(districtId, m, y);
        setDays(data);
        setLoading(false);
    };

    useEffect(() => {
        loadMonthData();
    }, [currentDate, districtId]);

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
        setSelectedDay(null);
    };

    // Holiday Check Logic
    const getHolidayName = (day: number, month: number, hijriDay: number, hijriMonth: number) => {
        // Fixed BD Holidays
        if (month === 2 && day === 21) return 'শহীদ দিবস';
        if (month === 3 && day === 17) return 'বঙ্গবন্ধুর জন্মদিন';
        if (month === 3 && day === 26) return 'স্বাধীনতা দিবস';
        if (month === 4 && day === 14) return 'পহেলা বৈশাখ';
        if (month === 5 && day === 1) return 'মে দিবস';
        if (month === 8 && day === 15) return 'জাতীয় শোক দিবস';
        if (month === 12 && day === 16) return 'বিজয় দিবস';
        if (month === 12 && day === 25) return 'বড়দিন';

        // Islamic Holidays (Approximate based on Hijri from service)
        if (hijriMonth === 9 && hijriDay === 1) return '১লা রমজান';
        if (hijriMonth === 10 && hijriDay === 1) return 'ঈদুল ফিতর';
        if (hijriMonth === 12 && hijriDay === 10) return 'ঈদুল আজহা';
        if (hijriMonth === 1 && hijriDay === 10) return 'আশুরা';
        if (hijriMonth === 3 && hijriDay === 12) return 'ঈদে মিলাদুন্নবী';
        
        // Friday
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (d.getDay() === 5) return 'শুক্রবার';

        return null;
    };

    const monthNamesBn = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];

    const formatTime = (t: string) => {
        const [h, m] = t.split(':');
        let hours = parseInt(h);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${englishToBanglaDigits(hours)}:${englishToBanglaDigits(m)} ${ampm}`;
    };

    return (
        <div className="bg-white min-h-[80vh] md:rounded-[2rem] p-4 md:p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-xl font-bold text-gray-800">নামাজের সময়সূচি (স্থায়ী)</h2>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl mb-6">
                <button onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-emerald-100">
                    <ChevronLeft className="w-5 h-5 text-emerald-700" />
                </button>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-emerald-900">
                        {monthNamesBn[currentDate.getMonth()]} {englishToBanglaDigits(currentDate.getFullYear())}
                    </h3>
                    <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{districtId === 'dhaka' ? 'ঢাকা' : districtId}</span>
                    </div>
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-emerald-100">
                    <ChevronRight className="w-5 h-5 text-emerald-700" />
                </button>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                </div>
            )}

            {/* Calendar Grid */}
            {!loading && (
                <div className="grid grid-cols-7 gap-2 mb-6 text-center">
                    {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'].map(d => (
                        <div key={d} className="text-xs font-bold text-gray-400 py-2">{d}</div>
                    ))}
                    
                    {/* Padding for start of month */}
                    {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="p-2"></div>
                    ))}

                    {/* Days */}
                    {days.map((day, idx) => {
                        const dateObj = new Date(day.readableDate); // Actually API returned date format string, but now we use standard date logic
                        // Fix for local parsing in case 'readableDate' format differs from API 
                        const dayNum = idx + 1; // Since we iterate days in month
                        
                        const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum).toDateString();
                        const holiday = getHolidayName(dayNum, currentDate.getMonth() + 1, day.hijriDate.day, day.hijriDate.month);
                        const isFriday = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum).getDay() === 5;
                        const isSelected = selectedDay === day;

                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDay(day)}
                                className={`
                                    relative p-2 rounded-xl flex flex-col items-center justify-center min-h-[3.5rem] transition-all
                                    ${isSelected ? 'bg-emerald-600 text-white shadow-lg scale-105 z-10' : 'bg-white hover:bg-gray-50 border border-gray-100'}
                                    ${isToday && !isSelected ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100' : ''}
                                    ${(holiday || isFriday) && !isSelected ? 'bg-red-50/50 border-red-100' : ''}
                                `}
                            >
                                <span className={`text-sm font-bold ${isSelected ? 'text-white' : (holiday || isFriday) ? 'text-red-600' : 'text-gray-700'}`}>
                                    {englishToBanglaDigits(dayNum)}
                                </span>
                                {(holiday && holiday !== 'শুক্রবার') && (
                                    <span className="absolute -bottom-1 w-1 h-1 bg-red-500 rounded-full"></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selected Day Details */}
            {selectedDay && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="font-bold text-gray-800 text-lg">
                                {/* Use selectedDay properties directly or re-derive date */}
                                {englishToBanglaDigits(selectedDay.readableDate.split(' ')[0])} {selectedDay.readableDate.split(' ')[1]}, {englishToBanglaDigits(selectedDay.readableDate.split(' ')[2])}
                            </h4>
                            <p className="text-sm text-emerald-600">
                                {englishToBanglaDigits(selectedDay.hijriDate.day)} {selectedDay.hijriDate.monthEn}, {englishToBanglaDigits(selectedDay.hijriDate.year)} হিজরি
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'সেহরি শেষ', time: selectedDay.Imsak, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                            { label: 'ফজর শুরু', time: selectedDay.Fajr },
                            { label: 'সূর্যোদয়', time: selectedDay.Sunrise },
                            { label: 'জুহর', time: selectedDay.Dhuhr },
                            { label: 'আসর', time: selectedDay.Asr },
                            { label: 'মাগরিব (ইফতার)', time: selectedDay.Maghrib, color: 'text-orange-600 bg-orange-50 border-orange-100' },
                            { label: 'ইশা', time: selectedDay.Isha },
                        ].map((item, i) => (
                            <div key={i} className={`p-3 rounded-xl border text-center shadow-sm ${item.color || 'bg-white border-gray-100'}`}>
                                <p className={`text-xs mb-1 ${item.color ? 'opacity-80' : 'text-gray-500'}`}>{item.label}</p>
                                <p className="font-mono font-bold text-gray-800">{formatTime(item.time)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
