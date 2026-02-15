import type { DailyLog } from '../types';

export interface FifteenDaySummary {
  totalCompleted: number;
  totalItems: number;
  completionRate: number;
  onTimeRate?: number;
  missed: number;
  streak?: number;
}

export interface FifteenDayChart {
  labels: string[];
  data: number[];
}

export interface FifteenDayReport {
  summary: FifteenDaySummary;
  barChart: FifteenDayChart;
  pieChart: FifteenDayChart;
}

type ActivityItem = { status?: string; isFarz?: boolean };
type ActivityRecord = DailyLog & { items?: ActivityItem[] };

const DEFAULT_EXPECTED_ITEMS = 5;

const normalizeStatus = (status: unknown): string => {
  if (typeof status === 'string') return status.toLowerCase();
  if (typeof status === 'boolean') return status ? 'done' : 'missed';
  return 'none';
};

const getDateKey = (date: Date, timeZone?: string): string => {
  if (!timeZone) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value ?? '0000';
  const month = parts.find(p => p.type === 'month')?.value ?? '01';
  const day = parts.find(p => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
};

const getLast15DateKeys = (timeZone?: string): string[] => {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 14; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(getDateKey(d, timeZone));
  }
  return keys;
};

const extractStatuses = (record: ActivityRecord): string[] => {
  if (Array.isArray(record.prayers) && record.prayers.length > 0) {
    return record.prayers
      .filter(p => p.isFarz)
      .map(p => normalizeStatus(p.status));
  }
  if (Array.isArray(record.items) && record.items.length > 0) {
    return record.items.map(item => normalizeStatus(item.status));
  }
  if (record.amols && typeof record.amols === 'object') {
    return Object.values(record.amols).map(val => normalizeStatus(val));
  }
  return [];
};

export const build15DayReport = (records: ActivityRecord[], timeZone?: string): FifteenDayReport => {
  const recordMap = new Map<string, ActivityRecord>();
  records.forEach(record => {
    if (record?.date) recordMap.set(record.date, record);
  });

  const sampleCounts = records
    .map(r => extractStatuses(r).length)
    .filter(count => count > 0);
  const defaultExpectedItems = sampleCounts.length > 0
    ? Math.max(...sampleCounts)
    : DEFAULT_EXPECTED_ITEMS;

  let totalCompleted = 0;
  let totalItems = 0;
  let missed = 0;
  let onTime = 0;
  let late = 0;
  let hasTimingStatus = false;

  const barLabels: string[] = [];
  const barData: number[] = [];

  const dateKeys = getLast15DateKeys(timeZone);
  dateKeys.forEach(dateKey => {
    const record = recordMap.get(dateKey);
    const statuses = record ? extractStatuses(record) : [];
    if (statuses.some(s => s === 'ontime' || s === 'late')) {
      hasTimingStatus = true;
    }

    const totalForDay = statuses.length > 0 ? statuses.length : defaultExpectedItems;
    let completedForDay = 0;
    let missedForDay = 0;
    let onTimeForDay = 0;
    let lateForDay = 0;

    statuses.forEach(status => {
      if (status === 'ontime') {
        onTimeForDay += 1;
      } else if (status === 'late') {
        lateForDay += 1;
      } else if (status === 'done') {
        completedForDay += 1;
      } else {
        missedForDay += 1;
      }
    });

    completedForDay += onTimeForDay + lateForDay;
    const counted = completedForDay + missedForDay;
    if (counted < totalForDay) {
      missedForDay += totalForDay - counted;
    }

    totalCompleted += completedForDay;
    totalItems += totalForDay;
    missed += missedForDay;
    onTime += onTimeForDay;
    late += lateForDay;

    barLabels.push(dateKey.split('-')[2]);
    barData.push(completedForDay);
  });

  let streak = 0;
  for (let i = barData.length - 1; i >= 0; i -= 1) {
    const record = recordMap.get(dateKeys[i]);
    const statuses = record ? extractStatuses(record) : [];
    const totalForDay = statuses.length > 0 ? statuses.length : defaultExpectedItems;
    const completedForDay = barData[i];
    if (totalForDay > 0 && completedForDay === totalForDay) {
      streak += 1;
    } else {
      break;
    }
  }

  const completionRate = totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0;
  const onTimeRate = hasTimingStatus && totalItems > 0 ? (onTime / totalItems) * 100 : undefined;

  const pieChart = hasTimingStatus
    ? { labels: ['On-time', 'Late', 'Missed'], data: [onTime, late, missed] }
    : { labels: ['Completed', 'Missed'], data: [totalCompleted, missed] };

  return {
    summary: {
      totalCompleted,
      totalItems,
      completionRate,
      onTimeRate,
      missed,
      streak,
    },
    barChart: { labels: barLabels, data: barData },
    pieChart,
  };
};

const runReportTests = () => {
  const baseDate = new Date('2026-01-15T12:00:00Z');
  const mkDateKey = (offset: number) => {
    const d = new Date(baseDate);
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  const allDone: ActivityRecord[] = Array.from({ length: 15 }).map((_, i) => ({
    date: mkDateKey(i),
    prayers: Array.from({ length: 5 }).map(() => ({ isFarz: true, status: 'done' })),
    quranAyahs: 0,
    amols: { surahWakiah: false, surahMulk: false, surahBaqarahLast2: false, threeQuls: false },
  }));
  const allDoneReport = build15DayReport(allDone, 'UTC');
  console.assert(allDoneReport.summary.completionRate === 100, 'All done should be 100%');

  const mixed: ActivityRecord[] = [
    { date: mkDateKey(0), prayers: [{ isFarz: true, status: 'done' }, { isFarz: true, status: 'missed' }], quranAyahs: 0, amols: { surahWakiah: false, surahMulk: false, surahBaqarahLast2: false, threeQuls: false } },
  ];
  const mixedReport = build15DayReport(mixed, 'UTC');
  console.assert(mixedReport.summary.totalItems >= 2, 'Mixed should count items');

  const missingReport = build15DayReport([], 'UTC');
  console.assert(missingReport.barChart.data.length === 15, 'Missing days should still render 15 bars');
};

if (import.meta.env?.DEV) {
  runReportTests();
}
