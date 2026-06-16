// timeUtils.js — NO CHANGES NEEDED
// This file uses only standard JS (Intl.DateTimeFormat) — works identically in React Native.
// Just copy to utils/timeUtils.js in your project.

const NIGERIA_TIMEZONE = "Africa/Lagos";

const getNigeriaDateParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: NIGERIA_TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date).filter((p) => p.type !== "literal");
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
};

export const getNigeriaTime = () => {
  const p = getNigeriaDateParts();
  return new Date(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
};

export const getNigeriaDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: NIGERIA_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

export const formatNigeriaTime = (date = null) =>
  new Intl.DateTimeFormat("en-NG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" }).format(date || getNigeriaTime());

export const getGreeting = () => {
  const h = getNigeriaTime().getHours();
  if (h >= 5 && h < 12)  return { text: "Good Morning! 🌅",   period: "morning" };
  if (h >= 12 && h < 17) return { text: "Good Afternoon! ☀️", period: "afternoon" };
  if (h >= 17 && h < 21) return { text: "Good Evening! 🌆",   period: "evening" };
  return                        { text: "Good Night! 🌙",      period: "night" };
};

export const isWorkoutTime = () => { const h = getNigeriaTime().getHours(); return (h >= 5 && h < 9) || (h >= 16 && h < 19); };

export const getMealTime = () => {
  const h = getNigeriaTime().getHours();
  if (h >= 6 && h < 10)  return "breakfast";
  if (h >= 12 && h < 14) return "lunch";
  if (h >= 19 && h < 21) return "dinner";
  return null;
};

export const getWeekDay       = (d = null) => new Intl.DateTimeFormat("en-NG", { weekday: "long" }).format(d || getNigeriaTime());
export const getMonthName     = (d = null) => new Intl.DateTimeFormat("en-NG", { month: "long" }).format(d || getNigeriaTime());
export const formatDateNigeria = (d = null) => new Intl.DateTimeFormat("en-NG", { year: "numeric", month: "short", day: "numeric" }).format(d || getNigeriaTime());
export const toNigeriaTimeString = (d = null) => (d || getNigeriaTime()).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

export const getWeekNumber = (d = null) => {
  const t = d || getNigeriaTime();
  const first = new Date(t.getFullYear(), 0, 1);
  return Math.ceil(((t - first) / 86400000 + first.getDay() + 1) / 7);
};

export const getStartOfDayNigeria   = () => { const t = getNigeriaTime(); t.setHours(0,0,0,0);       return t; };
export const getEndOfDayNigeria     = () => { const t = getNigeriaTime(); t.setHours(23,59,59,999);   return t; };
export const getStartOfWeekNigeria  = () => { const t = getNigeriaTime(); t.setDate(t.getDate() - t.getDay()); return t; };
export const getStartOfMonthNigeria = () => { const t = getNigeriaTime(); return new Date(t.getFullYear(), t.getMonth(), 1); };
