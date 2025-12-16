/**
 * Format current date and time in Korean format
 * Example: "2025년 12월 16일 14:30 화요일"
 */
export const formatCurrentDateTime = (currentTime: Date): string => {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const year = currentTime.getFullYear();
  const month = currentTime.getMonth() + 1;
  const date = currentTime.getDate();
  const dayName = days[currentTime.getDay()];
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');

  return `${year}년 ${month}월 ${date}일 ${hours}:${minutes} ${dayName}`;
};

/**
 * Check if a Date object represents today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

/**
 * Check if a date string (YYYY-MM-DD) represents today
 */
export const isDateToday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateStr === todayStr;
};

/**
 * Check if a date string (YYYY-MM-DD) represents yesterday
 */
export const isDateYesterday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  return dateStr === yesterdayStr;
};

/**
 * Check if a Date object falls within the current week
 * Week starts on Monday
 */
export const isThisWeek = (date: Date): boolean => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Sunday
  weekEnd.setHours(23, 59, 59, 999);

  return date >= weekStart && date <= weekEnd;
};

/**
 * Format a date string (YYYY-MM-DD) to Korean display format
 * Example: "2025-12-16" -> "2025년 12월 16일"
 */
export const formatDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
};

/**
 * Format a time string (HH:MM) to display format
 * Example: "14:30" -> "14:30"
 */
export const formatTimeString = (timeStr: string): string => {
  return timeStr || '';
};

/**
 * Get today's date as YYYY-MM-DD format
 */
export const getTodayString = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

/**
 * Get current time as HH:MM format
 */
export const getCurrentTimeString = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};
