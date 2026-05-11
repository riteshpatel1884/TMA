// lib/prep-utils.js

/**
 * Distributes topics across available days.
 * Strategy: pack topics into each day until daily hour budget is exceeded,
 * then spill to next day. Guarantees every topic gets a day even if days < topics.
 *
 * @param {Array<{ name, estimatedHrs, isCustom, subtopics }>} topics
 * @param {number} daysAvailable
 * @returns {Array<{ ...topic, scheduledDay }>}
 */
export function distributTopicsAcrossDays(topics, daysAvailable) {
  if (!topics.length) return [];

  const totalHrs = topics.reduce((sum, t) => sum + (t.estimatedHrs || 1), 0);
  const targetHrsPerDay = totalHrs / daysAvailable;

  const result = [];
  let day = 1;
  let dayHrs = 0;

  for (const topic of topics) {
    const hrs = topic.estimatedHrs || 1;

    // Spill to next day if adding this topic would exceed 140% of daily target
    // (the 1.4 buffer avoids splitting a topic mid-way)
    if (dayHrs > 0 && dayHrs + hrs > targetHrsPerDay * 1.4 && day < daysAvailable) {
      day++;
      dayHrs = 0;
    }

    result.push({ ...topic, scheduledDay: day });
    dayHrs += hrs;
  }

  return result;
}

/**
 * Groups topics by their scheduledDay. Returns a Map<number, topic[]>.
 */
export function groupTopicsByDay(topics) {
  const map = new Map();
  for (const topic of topics) {
    const d = topic.scheduledDay;
    if (!map.has(d)) map.set(d, []);
    map.get(d).push(topic);
  }
  return map;
}

/**
 * Given an exam date, returns the actual calendar date for a given plan day index.
 * Day 1 = today (or session createdAt), day 2 = tomorrow, etc.
 */
export function planDayToDate(sessionCreatedAt, dayIndex) {
  const base = new Date(sessionCreatedAt);
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + dayIndex - 1);
  return base;
}

/**
 * Returns the number of days between today and the exam date.
 * Returns 0 if exam date has passed.
 */
export function daysUntilExam(examDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((exam - today) / 86400000));
}

/**
 * Common aptitude topics with suggested hours.
 * Used to pre-populate the topic picker in the UI.
 */
export const PRESET_APTITUDE_TOPICS = [
  { name: "Number System",               estimatedHrs: 1.5, subtopics: ["LCM & HCF", "Divisibility", "Remainders"] },
  { name: "Percentages",                 estimatedHrs: 1.0, subtopics: ["Basic %", "Successive %"] },
  { name: "Profit & Loss",               estimatedHrs: 1.0, subtopics: ["Profit %", "Discount", "Marked Price"] },
  { name: "Time & Work",                 estimatedHrs: 1.5, subtopics: ["Pipes & Cisterns", "Work equivalence"] },
  { name: "Time, Speed & Distance",      estimatedHrs: 1.5, subtopics: ["Relative Speed", "Trains", "Boats"] },
  { name: "Averages",                    estimatedHrs: 0.5, subtopics: [] },
  { name: "Ratio & Proportion",          estimatedHrs: 1.0, subtopics: ["Mixture & Alligation"] },
  { name: "Simple & Compound Interest",  estimatedHrs: 1.0, subtopics: ["SI formula", "CI formula", "Doubling time"] },
  { name: "Probability",                 estimatedHrs: 1.5, subtopics: ["Basic probability", "Conditional", "Bayes"] },
  { name: "Permutation & Combination",   estimatedHrs: 1.5, subtopics: ["nPr", "nCr", "Circular permutation"] },
  { name: "Data Interpretation",         estimatedHrs: 2.0, subtopics: ["Bar chart", "Pie chart", "Line graph", "Tables"] },
  { name: "Logical Reasoning",           estimatedHrs: 2.0, subtopics: ["Directions", "Rankings", "Assumptions"] },
  { name: "Series & Sequences",          estimatedHrs: 1.0, subtopics: ["Number series", "Letter series", "Missing term"] },
  { name: "Syllogisms",                  estimatedHrs: 1.0, subtopics: ["Venn diagrams", "All/Some/No patterns"] },
  { name: "Blood Relations",             estimatedHrs: 0.5, subtopics: [] },
  { name: "Coding-Decoding",             estimatedHrs: 1.0, subtopics: ["Letter shift", "Pattern coding"] },
  { name: "Seating Arrangement",         estimatedHrs: 1.5, subtopics: ["Linear", "Circular", "Double row"] },
  { name: "Verbal Ability",              estimatedHrs: 1.0, subtopics: ["Para jumbles", "Reading comprehension", "Synonyms/Antonyms"] },
  { name: "Clocks & Calendars",          estimatedHrs: 0.5, subtopics: ["Angle between hands", "Odd days"] },
  { name: "Geometry & Mensuration",      estimatedHrs: 1.5, subtopics: ["2D shapes", "3D shapes", "Surface area/Volume"] },
];

export const PRESET_TECHNICAL_TOPICS = [
  { name: "Data Structures",        estimatedHrs: 3.0, subtopics: ["Arrays", "Linked Lists", "Stacks", "Queues", "Trees", "Graphs"] },
  { name: "Algorithms",             estimatedHrs: 2.5, subtopics: ["Sorting", "Searching", "Dynamic Programming", "Greedy"] },
  { name: "OOPS Concepts",          estimatedHrs: 1.5, subtopics: ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction"] },
  { name: "DBMS",                   estimatedHrs: 2.0, subtopics: ["SQL queries", "Normalization", "Transactions", "Indexing"] },
  { name: "Operating Systems",      estimatedHrs: 1.5, subtopics: ["Processes", "Threads", "Memory Management", "Deadlock"] },
  { name: "Computer Networks",      estimatedHrs: 1.5, subtopics: ["OSI Model", "TCP/IP", "DNS", "HTTP"] },
  { name: "System Design Basics",   estimatedHrs: 2.0, subtopics: ["Load Balancing", "Caching", "CAP Theorem"] },
  { name: "Time Complexity",        estimatedHrs: 1.0, subtopics: ["Big O notation", "Best/Worst/Average case"] },
];

export const ROUND_TYPE_PRESETS = {
  Aptitude:  PRESET_APTITUDE_TOPICS,
  Technical: PRESET_TECHNICAL_TOPICS,
  HR:        [],
  "Group Discussion": [],
  "Coding Round": PRESET_TECHNICAL_TOPICS,
  Other:     [],
};