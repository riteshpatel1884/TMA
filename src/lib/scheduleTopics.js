// lib/scheduleTopics.js
// Pure helper — no DB calls. Works in both server and client contexts.

/**
 * Given a list of topics and a target date (or number of days),
 * returns the same topics with a `daySlot` assigned (1-based).
 *
 * Rules:
 *  - Topics are distributed as evenly as possible across the days.
 *  - If there are more topics than days, some days get an extra topic.
 *  - If there are fewer topics than days, later days are left empty
 *    (daySlot won't exceed totalTopics).
 *
 * @param {Array<{id:string, name:string, category:string}>} topics
 * @param {number} totalDays  - number of days remaining (>= 1)
 * @returns {Array<{...topic, daySlot:number}>}
 */
export function distributeTopics(topics, totalDays) {
  if (!topics.length || totalDays < 1) return topics;

  const days = Math.max(1, Math.floor(totalDays));
  const perDay = Math.ceil(topics.length / days);

  return topics.map((topic, i) => ({
    ...topic,
    daySlot: Math.floor(i / perDay) + 1,
  }));
}

/**
 * Calculate number of days between today and a target date (inclusive of today).
 * Returns at least 1 so there's always at least one day to work with.
 *
 * @param {Date|string} targetDate
 * @returns {number}
 */
export function daysUntil(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);

  // Normalise to midnight local time for both
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

/**
 * Group topics by their daySlot.
 * Returns a Map<daySlot, topic[]> sorted by day.
 *
 * @param {Array<{daySlot:number|null}>} topics
 * @returns {Map<number, Array>}
 */
export function groupByDay(topics) {
  const map = new Map();
  for (const t of topics) {
    const slot = t.daySlot ?? 0; // 0 = unscheduled
    if (!map.has(slot)) map.set(slot, []);
    map.get(slot).push(t);
  }
  // Sort by slot number ascending
  return new Map([...map.entries()].sort((a, b) => a[0] - b[0]));
}

/**
 * Given a tracker's roundDate and a daySlot (1-based),
 * compute the actual calendar date for that slot.
 *
 * e.g. roundDate = June 9, daysUntil = 8, daySlot = 1 → June 1
 *
 * @param {Date|string} roundDate
 * @param {number} daySlot  (1-based)
 * @param {number} totalDays
 * @returns {Date}
 */
export function slotToDate(roundDate, daySlot, totalDays) {
  const target = new Date(roundDate);
  target.setHours(0, 0, 0, 0);

  // Day 1 starts at (roundDate - totalDays + 1)
  const startOffset = totalDays - 1; // days before roundDate that day 1 falls on
  const d = new Date(target);
  d.setDate(d.getDate() - startOffset + (daySlot - 1));
  return d;
}

/**
 * Format a Date to a human-readable string like "Mon, Jun 2"
 */
export function formatSlotDate(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}