// Real (not mock) forex session status, derived from the current UTC hour.
// Hours are the standard approximation used across the site already (see
// Advanced4.jsx's Time and Price lesson) and ignore daylight-saving shifts.
const SESSIONS = [
  { key: 'tokyo', label: 'Tokyo', startUTC: 0, endUTC: 9 },
  { key: 'london', label: 'London', startUTC: 8, endUTC: 17 },
  { key: 'newYork', label: 'New York', startUTC: 13, endUTC: 22 },
];

export function getSessionStatus(now = new Date()) {
  const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
  return SESSIONS.map((s) => ({
    ...s,
    open: hour >= s.startUTC && hour < s.endUTC,
  }));
}
