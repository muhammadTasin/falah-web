
import { GoogleGenAI } from "@google/genai";
import { DayMode, HijriDate, DailyLog } from "../types";

// Helper to safely get the API key
const getApiKey = (): string => {
  return import.meta.env.VITE_GEMINI_API_KEY ?? "";
};

const apiKey = getApiKey();
// Note: We use gemini-3-flash-preview as requested, but if you experience issues on free tier, 
// you might need to ensure the project has billing enabled or check quotas.
const ai = apiKey ? new GoogleGenAI({ apiKey: apiKey }) : null;

// Context-Aware Daily Insight
export const getDailyInsight = async (
  mode: DayMode, 
  hijri: HijriDate, 
  recentLogs: DailyLog[], 
  userName: string
): Promise<string> => {
  if (!apiKey || !ai) return "AI বিশ্লেষণ চালু করতে দয়া করে API Key সেট করুন।";

  // 1. Analyze Consistency
  let performanceContext = "No recent data available.";
  if (recentLogs.length > 0) {
    const summary = recentLogs.slice(0, 3).map(log => {
      const doneCount = log.prayers.filter(p => p.isFarz && p.status === 'done').length;
      return `${log.date} (${doneCount}/5)`;
    }).join(', ');
    performanceContext = `Recent Prayer Performance (Last 3 days): [${summary}]`;
  }

  // 2. Construct Prompt
  const prompt = `
    Role: You are a wise, gentle, and empathetic Islamic companion.
    
    Target User Context:
    - Name: "${userName}"
    - Task: INFER THE GENDER based on the name "${userName}". 
      - If the name sounds female (e.g., Fatema, Ayesha, Sumaiya, Mrs X), address the user as a sister/female.
      - If the name sounds male (e.g., Abdullah, Rahim, Mr Y), address the user as a brother/male.
      - If unsure, remain neutral.
    - Date: ${hijri.day} ${hijri.monthName}, ${mode}.
    - Performance: ${performanceContext}.

    Output Task:
    Select ONE authentic Islamic quote (Quran Ayah OR Sahih Hadith) in Bengali.

    Selection Logic:
    1. **If performance is LOW (missing prayers)**: Choose a quote about Allah's Mercy (Rahmah) and returning to Him. Be gentle.
    2. **If performance is HIGH**: Choose a quote about Consistency (Istiqamah) and Gratitude.
    3. **GENDER SPECIFIC**: 
       - If user is FEMALE: You may select Hadiths relevant to women's spirituality or general verses.
       - If user is MALE: General verses or hadiths about jama'ah (congregation) if relevant.
    4. **Friday/Ramadan**: Prioritize these events if today matches.

    Output Rules:
    - Language: Bengali ONLY.
    - Format: Plain text. Max 2 sentences.
    - Content: The quote + brief reference (e.g., "সুরা বাকারা: ২৮৬").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "আল্লাহর জিকির দ্বারা অন্তর প্রশান্ত হয়।";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    if (mode === DayMode.FRIDAY) return "জুমুআর দিনে বেশি বেশি দরুদ পাঠ করুন। (হাদিস)";
    return "নিশ্চয়ই নামাজের মাধ্যমে অশ্লীল ও মন্দ কাজ থেকে বিরত থাকা যায়। (আল-আনকাবুত: ৪৫)";
  }
};

// Consistency Analysis (Detailed Report)
export const getConsistencyAnalysis = async (logs: DailyLog[], userName: string): Promise<string> => {
  if (!apiKey || !ai) return "AI বিশ্লেষণ চালু নেই। সম্ভবত API Key সেট করা হয়নি।";
  if (logs.length === 0) return "বিশ্লেষণ করার জন্য পর্যাপ্ত তথ্য নেই। দয়া করে কয়েক দিন ব্যবহার করুন।";

  const dataSummary = logs.map(log => {
    const totalFarz = log.prayers.filter(p => p.isFarz).length;
    const completed = log.prayers.filter(p => p.isFarz && p.status === 'done').length;
    const quran = log.quranAyahs;
    const amols = log.amols ? Object.entries(log.amols).filter(([_, v]) => v).length : 0;
    return `Date: ${log.date}, Prayers: ${completed}/${totalFarz}, Quran Ayahs: ${quran}, Amols Done: ${amols}`;
  }).join('\n');

  const prompt = `
    Role: You are a strict yet supportive Islamic mentor.
    Target User: "${userName}" (Infer gender from name for addressing e.g. "Brother" or "Sister" in Bengali).

    USER DATA (Last 7 days):
    ${dataSummary}

    INSTRUCTIONS:
    1. Analyze the data for **CONSISTENCY**.
    2. **Crucial**: If the user is missing prayers or doing 0 amols, point it out clearly but gently.
    3. If the user is doing well, congratulate them.
    4. Provide 1 actionable spiritual tip based on their weak area.
    5. Language: Bengali.
    6. Tone: Personal, Direct ("আপনি..."), and Motivating.
    7. Length: Short paragraph (Max 4 sentences).
  `;

  try {
     const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "ধারাবাহিকতা বজায় রাখার চেষ্টা করুন। আল্লাহ আপনার সহায় হোন।";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "বর্তমানে বিশ্লেষণ করা সম্ভব হচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।";
  }
};
