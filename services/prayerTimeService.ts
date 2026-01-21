
import { District, districts } from '../data/districts';
import { getDhakaTimesForDate } from './ifbCalendarData';
import { getHijriDate } from './dateUtils';

export interface PrayerTimesData {
  Fajr: string;   // Fajr Start
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string; // Sehri Last Time (Sahur)
  Midnight: string;
  readableDate: string;
  hijriDate: {
    day: number;
    month: number;
    year: number;
    monthEn: string;
    monthAr: string;
  }
}

// Helper to add minutes to "HH:mm" time
const addMinutes = (timeStr: string, minutes: number): string => {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    
    const newH = date.getHours().toString().padStart(2, '0');
    const newM = date.getMinutes().toString().padStart(2, '0');
    return `${newH}:${newM}`;
};

export const fetchPrayerTimes = async (districtId: string, date: Date): Promise<PrayerTimesData | null> => {
    return calculateLocalPrayerTimes(districtId, date);
};

export const fetchMonthlyPrayerTimes = async (districtId: string, month: number, year: number): Promise<PrayerTimesData[]> => {
    const results: PrayerTimesData[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const data = await calculateLocalPrayerTimes(districtId, date);
        if (data) results.push(data);
    }
    return results;
};

// Core Calculation Logic using IFB Data
const calculateLocalPrayerTimes = async (districtId: string, date: Date): Promise<PrayerTimesData | null> => {
    const district = districts.find(d => d.id === districtId) || districts[0];
    
    // 1. Get Base Times for Dhaka
    // [SehriEnd, Sunrise, Dhuhr, Asr, Maghrib, Isha]
    const baseTimes = getDhakaTimesForDate(date);
    
    // 2. Apply District Offsets
    // Sehri Offset affects: Sehri End (Imsak) and Fajr Start
    // Iftar Offset affects: Maghrib, Isha.
    // Sunrise/Dhuhr/Asr: Usually follow a mix or longitude. 
    // IFB rule of thumb: 
    // - Sunrise follows Sehri offset roughly (Sun rises East first).
    // - Asr follows Iftar offset roughly (Sun sets East first).
    // - Dhuhr is mid-point.
    
    const sehriOffset = district.offsetSehri;
    const iftarOffset = district.offsetIftar;

    const imsak = addMinutes(baseTimes[0], sehriOffset); // Sehri End
    const fajr = imsak; // Fajr begins when Sehri ends (Subh Sadiq)
    const sunrise = addMinutes(baseTimes[1], sehriOffset); // Approx follows Eastern shift
    const dhuhr = addMinutes(baseTimes[2], Math.round((sehriOffset + iftarOffset) / 2)); 
    const asr = addMinutes(baseTimes[3], iftarOffset); 
    const maghrib = addMinutes(baseTimes[4], iftarOffset); // Iftar
    const sunset = maghrib;
    const isha = addMinutes(baseTimes[5], iftarOffset);
    
    // Midnight (Islamic midnight: Sunset to Fajr half-way)
    // We calculate approx or just use fixed logic if needed. 
    // Simple logic: 00:00 or derived? Let's leave it simple for now or derive from sunset/fajr.
    const midnight = "00:00"; 

    // Hijri Conversion
    const hijri = getHijriDate(date);

    return {
        Fajr: fajr,
        Sunrise: sunrise,
        Dhuhr: dhuhr,
        Asr: asr,
        Sunset: sunset,
        Maghrib: maghrib,
        Isha: isha,
        Imsak: imsak,
        Midnight: midnight,
        readableDate: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        hijriDate: {
            day: hijri.day,
            month: hijri.month,
            year: hijri.year,
            monthEn: hijri.monthName,
            monthAr: hijri.monthName
        }
    };
};

export const parseTimeString = (timeStr: string, baseDate: Date = new Date()): Date => {
  if (!timeStr) return baseDate;
  const cleanTime = timeStr.split(' ')[0];
  const [hours, minutes] = cleanTime.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const banglaToEnglishDigits = (str: string): string => {
  const map: Record<string, string> = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  return str.replace(/[০-৯]/g, (match) => map[match]);
};

export const englishToBanglaDigits = (str: string | number): string => {
  const map: Record<string, string> = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
  return String(str).replace(/[0-9]/g, (match) => map[match]);
};

// Countdown Logic
export interface PrayerCountdownState {
  percent: number;
  remainingText: string;
  label: string;
  isForbidden: boolean;
  nextWaqtName: string;
  currentWaqtName: string | null;
}

export const calculatePrayerCountdown = (times: PrayerTimesData, now: Date): PrayerCountdownState => {
    const fajr = parseTimeString(times.Fajr, now);
    const sunrise = parseTimeString(times.Sunrise, now);
    const dhuhr = parseTimeString(times.Dhuhr, now);
    const asr = parseTimeString(times.Asr, now);
    const maghrib = parseTimeString(times.Maghrib, now);
    const isha = parseTimeString(times.Isha, now);
    
    const nextFajr = new Date(fajr);
    nextFajr.setDate(nextFajr.getDate() + 1);

    // Forbidden: Sunrise to Ishraq (~15m), Zawal (~15m before Dhuhr), Sunset (~15m before Maghrib)
    const zawalStart = new Date(dhuhr.getTime() - 15 * 60000); 
    const sunsetStart = new Date(maghrib.getTime() - 15 * 60000);

    let targetTime = fajr;
    let startTime = new Date(fajr.getTime() - 4 * 60 * 60000); 
    let label = "ফজর শুরু হতে বাকি";
    let isForbidden = false;
    let nextWaqtName = "Fajr";
    let currentWaqtName = null;

    if (now < fajr) {
      targetTime = fajr;
      startTime = new Date(fajr.getTime() - 2 * 60 * 60000); 
      // Special: Pre-Fajr is Sehri time
      label = "সেহরি শেষ হতে বাকি"; 
      nextWaqtName = "Fajr";
      currentWaqtName = "Isha"; 
    } else if (now < sunrise) {
      targetTime = sunrise;
      startTime = fajr;
      label = "ফজর শেষ হতে বাকি";
      nextWaqtName = "Sunrise";
      currentWaqtName = "Fajr";
    } else if (now < dhuhr) {
       if (now >= zawalStart) {
         isForbidden = true;
         label = "নিষিধ সময় (জাওয়াল)";
         targetTime = dhuhr;
         startTime = zawalStart;
       } else {
         targetTime = dhuhr;
         startTime = sunrise;
         label = "জুহর শুরু হতে বাকি";
         nextWaqtName = "Dhuhr";
         currentWaqtName = "Ishraq/Chasht";
       }
    } else if (now < asr) {
      targetTime = asr;
      startTime = dhuhr;
      label = "জুহর শেষ হতে বাকি";
      nextWaqtName = "Asr";
      currentWaqtName = "Dhuhr";
    } else if (now < maghrib) {
       if (now >= sunsetStart) {
         isForbidden = true;
         label = "নিষিধ সময় (সূর্যাস্ত)";
         targetTime = maghrib;
         startTime = sunsetStart;
       } else {
         targetTime = maghrib;
         startTime = asr;
         label = "আসর শেষ হতে বাকি";
         nextWaqtName = "Maghrib";
         currentWaqtName = "Asr";
       }
    } else if (now < isha) {
      targetTime = isha;
      startTime = maghrib;
      label = "মাগরিব শেষ হতে বাকি";
      nextWaqtName = "Isha";
      currentWaqtName = "Maghrib";
    } else {
      targetTime = nextFajr;
      startTime = isha;
      label = "ঈশা শেষ / ফজর শুরু";
      nextWaqtName = "NextFajr";
      currentWaqtName = "Isha";
    }

    const totalDuration = targetTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    const percent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const remainingMs = targetTime.getTime() - now.getTime();
    
    const rSeconds = Math.floor((remainingMs / 1000) % 60);
    const rMinutes = Math.floor((remainingMs / (1000 * 60)) % 60);
    const rHours = Math.floor((remainingMs / (1000 * 60 * 60)));

    const formatTime = (t: number) => t.toString().padStart(2, '0');
    const remainingText = `${englishToBanglaDigits(formatTime(rHours))}:${englishToBanglaDigits(formatTime(rMinutes))}:${englishToBanglaDigits(formatTime(rSeconds))}`;

    return { percent, remainingText, label, isForbidden, nextWaqtName, currentWaqtName };
}
