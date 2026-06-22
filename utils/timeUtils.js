
// ── Core "local time" getter 
// No timezone forcing — just use the device's own Date, which is already
// in the user's local time.
export const getLocalTime = () => new Date();

// Kept for backward compatibility with existing imports — now returns
// the device's local time instead of Nigeria time.
export const getNigeriaTime = () => new Date();

// ── Date key (YYYY-MM-DD) in the user's own local date 
export const getLocalDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);

export const getNigeriaDateKey = (date = new Date()) => getLocalDateKey(date);

// ── Full formatted date+time in the user's own local timezone 
export const formatLocalTime = (date = null) =>
  new Intl.DateTimeFormat(undefined, {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZoneName: "short",
  }).format(date || new Date());

export const formatNigeriaTime = (date = null) => formatLocalTime(date);

// ── Greeting based on the user's own local hour 
export const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)  return { text: "Good Morning! 🌅",   period: "morning" };
  if (h >= 12 && h < 17) return { text: "Good Afternoon! ☀️", period: "afternoon" };
  if (h >= 17 && h < 21) return { text: "Good Evening! 🌆",   period: "evening" };
  return                        { text: "Good Night! 🌙",      period: "night" };
};

// ── Workout / meal time checks based on the user's own local hour 
export const isWorkoutTime = () => {
  const h = new Date().getHours();
  return (h >= 5 && h < 9) || (h >= 16 && h < 19);
};

export const getMealTime = () => {
  const h = new Date().getHours();
  if (h >= 6 && h < 10)  return "breakfast";
  if (h >= 12 && h < 14) return "lunch";
  if (h >= 19 && h < 21) return "dinner";
  return null;
};

// ── Weekday / month name in the user's own locale 
export const getWeekDay = (d = null) =>
  new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(d || new Date());

export const getMonthName = (d = null) =>
  new Intl.DateTimeFormat(undefined, { month: "long" }).format(d || new Date());

export const formatDateLocal = (d = null) =>
  new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(d || new Date());

export const formatDateNigeria = (d = null) => formatDateLocal(d);

export const toLocalTimeString = (d = null) =>
  (d || new Date()).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

export const toNigeriaTimeString = (d = null) => toLocalTimeString(d);

// ── Week number in the user's own local time 
export const getWeekNumber = (d = null) => {
  const t = d || new Date();
  const first = new Date(t.getFullYear(), 0, 1);
  return Math.ceil(((t - first) / 86400000 + first.getDay() + 1) / 7);
};

// ── Start/end of day, week, month — all in the user's own local time 
export const getStartOfDayLocal = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
export const getEndOfDayLocal   = () => { const t = new Date(); t.setHours(23, 59, 59, 999); return t; };
export const getStartOfWeekLocal = () => { const t = new Date(); t.setDate(t.getDate() - t.getDay()); return t; };
export const getStartOfMonthLocal = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1); };

// Backward-compatible aliases
export const getStartOfDayNigeria   = getStartOfDayLocal;
export const getEndOfDayNigeria     = getEndOfDayLocal;
export const getStartOfWeekNigeria  = getStartOfWeekLocal;
export const getStartOfMonthNigeria = getStartOfMonthLocal;

// ── Convert a UTC timestamp from the backend into the user's local time 
// Use this whenever the backend sends back an ISO UTC string
// (e.g. "2026-06-18T14:30:00Z") — it will display correctly no matter
// where the user is.
export const fromBackendUtc = (utcIsoString) => {
  if (!utcIsoString) return new Date();
  return new Date(utcIsoString);
};

// ── Get the device's own timezone name, e.g. "Africa/Lagos", "America/New_York" 
export const getDeviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
};
