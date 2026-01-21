
// Islamic Foundation Bangladesh - Permanent Calendar Base Times (Dhaka)
// Format: [SehriEnd, Sunrise, Dhuhr, Asr, Maghrib, Isha] in "HH:mm"
// Keys are "Month-Day"
// Interpolation will be used for missing days.

export const dhakaBaseSchedule: Record<string, string[]> = {
    // January
    "0-1": ["05:22", "06:42", "12:04", "15:43", "17:26", "18:43"],
    "0-11": ["05:25", "06:44", "12:08", "15:50", "17:33", "18:49"],
    "0-21": ["05:25", "06:43", "12:11", "15:57", "17:40", "18:56"],
    // February
    "1-1": ["05:22", "06:40", "12:13", "16:04", "17:48", "19:04"],
    "1-11": ["05:16", "06:34", "12:14", "16:10", "17:54", "19:10"],
    "1-21": ["05:08", "06:26", "12:13", "16:14", "18:00", "19:16"],
    // March
    "2-1": ["04:59", "06:19", "12:12", "16:17", "18:05", "19:21"],
    "2-11": ["04:48", "06:09", "12:10", "16:19", "18:10", "19:25"],
    "2-21": ["04:37", "05:58", "12:07", "16:19", "18:14", "19:29"],
    // April
    "3-1": ["04:24", "05:47", "12:04", "16:19", "18:19", "19:35"],
    "3-11": ["04:14", "05:37", "12:01", "16:19", "18:23", "19:40"],
    "3-21": ["04:03", "05:28", "11:59", "16:20", "18:27", "19:45"],
    // May
    "4-1": ["03:54", "05:21", "11:57", "16:21", "18:32", "19:51"],
    "4-11": ["03:46", "05:15", "11:57", "16:24", "18:37", "19:58"],
    "4-21": ["03:40", "05:11", "11:57", "16:28", "18:41", "20:04"],
    // June
    "5-1": ["03:36", "05:08", "11:59", "16:32", "18:46", "20:11"],
    "5-11": ["03:35", "05:08", "12:01", "16:35", "18:50", "20:16"],
    "5-21": ["03:37", "05:10", "12:03", "16:38", "18:53", "20:19"],
    // July
    "6-1": ["03:41", "05:13", "12:05", "16:39", "18:54", "20:19"],
    "6-11": ["03:46", "05:17", "12:06", "16:39", "18:53", "20:17"],
    "6-21": ["03:52", "05:21", "12:07", "16:37", "18:50", "20:12"],
    // August
    "7-1": ["04:00", "05:27", "12:06", "16:32", "18:45", "20:04"],
    "7-11": ["04:07", "05:32", "12:05", "16:26", "18:38", "19:55"],
    "7-21": ["04:13", "05:36", "12:03", "16:18", "18:30", "19:45"],
    // September
    "8-1": ["04:19", "05:40", "12:00", "16:09", "18:19", "19:33"],
    "8-11": ["04:24", "05:43", "11:56", "16:00", "18:09", "19:21"],
    "8-21": ["04:29", "05:46", "11:53", "15:52", "17:58", "19:09"],
    // October
    "9-1": ["04:34", "05:50", "11:50", "15:43", "17:48", "18:59"],
    "9-11": ["04:39", "05:54", "11:47", "15:35", "17:38", "18:50"],
    "9-21": ["04:44", "05:59", "11:45", "15:27", "17:29", "18:42"],
    // November
    "10-1": ["04:50", "06:05", "11:44", "15:20", "17:21", "18:35"],
    "10-11": ["04:56", "06:12", "11:44", "15:15", "17:15", "18:30"],
    "10-21": ["05:03", "06:19", "11:46", "15:12", "17:13", "18:28"],
    // December
    "11-1": ["05:10", "06:26", "11:49", "15:11", "17:12", "18:30"],
    "11-11": ["05:16", "06:33", "11:53", "15:13", "17:15", "18:34"],
    "11-21": ["05:21", "06:38", "11:58", "15:17", "17:19", "18:39"],
    // Wrap around for interpolation
    "12-1": ["05:22", "06:42", "12:04", "15:43", "17:26", "18:43"], 
};

// Helper to interpolate time "HH:mm" between two points
export function interpolateTime(time1: string, time2: string, fraction: number): string {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    
    let totalM1 = h1 * 60 + m1;
    let totalM2 = h2 * 60 + m2;
    
    // Handle midnight wrapping (unlikely for prayer times but good practice)
    if (totalM2 < totalM1) totalM2 += 24 * 60;
    
    const diff = totalM2 - totalM1;
    const resultM = totalM1 + (diff * fraction);
    
    let h = Math.floor(resultM / 60) % 24;
    let m = Math.round(resultM % 60);
    
    if (m === 60) {
        m = 0;
        h = (h + 1) % 24;
    }
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Main function to get Dhaka times for any date
export function getDhakaTimesForDate(date: Date): string[] {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Find closest lower key
    const keys = Object.keys(dhakaBaseSchedule).map(k => {
        const [m, d] = k.split('-').map(Number);
        return { m, d, key: k };
    }).sort((a, b) => (a.m * 31 + a.d) - (b.m * 31 + b.d));

    // Simple logic: key 0-1, 0-11, 0-21...
    // Find bound
    let lower = keys[0];
    let upper = keys[1];

    // Helper to get day of year approx index
    const getIndex = (m: number, d: number) => m * 31 + d;
    const currentIdx = getIndex(month, day);

    for (let i = 0; i < keys.length - 1; i++) {
        if (currentIdx >= getIndex(keys[i].m, keys[i].d)) {
            lower = keys[i];
            upper = keys[i + 1];
        } else {
            break;
        }
    }
    
    // Check wrapped year edge case
    if (month === 11 && day > 21) {
        lower = keys.find(k => k.key === "11-21")!;
        upper = keys.find(k => k.key === "12-1")!; // Virtual Jan 1 next year
    }

    const t1 = dhakaBaseSchedule[lower.key];
    const t2 = dhakaBaseSchedule[upper.key];

    const idx1 = getIndex(lower.m, lower.d);
    let idx2 = getIndex(upper.m, upper.d);
    let curr = currentIdx;

    if (upper.key === "12-1") {
         idx2 = 12 * 31 + 1; // 373
    }
    
    const range = idx2 - idx1;
    const fraction = range === 0 ? 0 : (curr - idx1) / range;

    return t1.map((t, i) => interpolateTime(t, t2[i], fraction));
}
