import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

const STORE_URL = "https://store.elamai.in/product/habit-tracker";
const MAX_CLICKS = 10;

const YEAR = 2026;
const MONTHS = [
  { value: "2", label: "March 2026",     name: "March",     days: 31 },
  { value: "3", label: "April 2026",     name: "April",     days: 30 },
  { value: "4", label: "May 2026",       name: "May",       days: 31 },
  { value: "5", label: "June 2026",      name: "June",      days: 30 },
  { value: "6", label: "July 2026",      name: "July",      days: 31 },
  { value: "7", label: "August 2026",    name: "August",    days: 31 },
  { value: "8", label: "September 2026", name: "September", days: 30 },
  { value: "9", label: "October 2026",   name: "October",   days: 31 },
  { value: "10", label: "November 2026", name: "November",  days: 30 },
  { value: "11", label: "December 2026", name: "December",  days: 31 },
];

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Exact habits from the real product
const DEMO_HABITS = [
  { id: "1", name: "Wake up at 05:00 ⏰", order: 0, goal: 0 },
  { id: "2", name: "Gym 💪",              order: 1, goal: 0 },
  { id: "3", name: "No porn 💦🚫",        order: 2, goal: 0 },
  { id: "4", name: "Read 20 Pages 📖",    order: 3, goal: 0 },
  { id: "5", name: "Goal Journaling ✍️",  order: 4, goal: 0 },
  { id: "6", name: "No Alcohol 🍾",       order: 5, goal: 0 },
  { id: "7", name: "Sleep by 10 PM 💤",   order: 6, goal: 0 },
  { id: "8", name: "Learn New Skill 🔑",  order: 7, goal: 0 },
  { id: "9", name: "Eat healthy 🍽️",     order: 8, goal: 0 },
  { id: "10", name: "Cold shower 🚿",     order: 9, goal: 0 },
];

const WEEK_COLORS_BG = ["bg-week1","bg-week2","bg-week3","bg-week4","bg-week5","bg-weekMonthly"];
const WEEK_HSL_COLORS = [
  "hsl(221, 83%, 53%)","hsl(271, 81%, 56%)","hsl(0, 84%, 60%)",
  "hsl(45, 93%, 47%)","hsl(142, 71%, 45%)","hsl(300, 64%, 49%)",
];
const WEEK_HSL_BG_LIGHT = [
  "hsl(221, 83%, 86%)","hsl(271, 81%, 86%)","hsl(0, 84%, 87%)",
  "hsl(45, 93%, 87%)","hsl(142, 71%, 87%)","hsl(300, 64%, 87%)",
];
const WEEK_HSL_BG_DARK = [
  "hsl(221, 40%, 18%)","hsl(271, 35%, 19%)","hsl(0, 35%, 19%)",
  "hsl(45, 35%, 18%)","hsl(142, 30%, 17%)","hsl(300, 30%, 18%)",
];

function getDayNames(monthIdx: number, year: number, daysInMonth: number) {
  const names: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    names.push(DAY_ABBR[new Date(year, monthIdx, d).getDay()]);
  }
  return names;
}

function getWeekRanges(daysInMonth: number, monthName: string) {
  const ranges: { label: string; days: number[]; color: string; dateRange: string }[] = [];
  const colors = ["bg-week1","bg-week2","bg-week3","bg-week4","bg-week5"];
  let day = 1, weekNum = 1;
  while (day <= daysInMonth) {
    const start = day;
    const end = Math.min(day + 6, daysInMonth);
    const days: number[] = [];
    for (let d = start; d <= end; d++) days.push(d);
    const mo = monthName.substring(0, 3);
    ranges.push({
      label: `Week ${weekNum}`, days, color: colors[(weekNum - 1) % 5],
      dateRange: `${String(start).padStart(2,"0")} – ${String(end).padStart(2,"0")} ${mo}`,
    });
    day = end + 1; weekNum++;
  }
  return ranges;
}

type LogMap = Record<string, Record<number, boolean>>;

function buildDemoLogs(daysInMonth: number): LogMap {
  const logs: LogMap = {};
  DEMO_HABITS.forEach((h) => {
    logs[h.id] = {};
    // all empty by default
  });
  return logs;
}

// ── Subscribe Modal ────────────────────────────────────────────────────────────
function SubscribeModal({ onClose, isLimitReached }: { onClose: () => void; isLimitReached: boolean }) {
  const content = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%", maxWidth: "360px",
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "16px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column", gap: "20px",
          padding: "28px 24px",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span style={{ fontSize: "22px", fontWeight: 900, color: "hsl(var(--foreground))", letterSpacing: "-0.02em" }}>trackly</span>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "28px", height: "28px", backgroundColor: "#DC2626",
            borderRadius: "6px", color: "white", fontSize: "14px", fontWeight: 900,
          }}>T</span>
        </div>

        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: "8px", margin: "0 0 8px" }}>
            {isLimitReached ? "You've used your 10 free interactions" : "This is a preview"}
          </h2>
          <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", lineHeight: 1.6, margin: 0 }}>
            {isLimitReached
              ? "Get full access to track your own habits, add unlimited habits, and see your real progress."
              : "Get full access to create and track your own habits. One-time purchase, all future updates included."}
          </p>
        </div>

        <a
          href={STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block", width: "100%", padding: "12px",
            backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))",
            fontWeight: 600, fontSize: "14px", borderRadius: "12px",
            textAlign: "center", textDecoration: "none",
            transition: "opacity 0.15s",
            boxSizing: "border-box",
          }}
        >
          Get Trackly
        </a>

        {!isLimitReached && (
          <button
            onClick={onClose}
            style={{
              fontSize: "12px", color: "hsl(var(--muted-foreground))",
              background: "none", border: "none", cursor: "pointer",
              textAlign: "center",
            }}
          >
            Continue browsing preview
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

function MiniBar({ percentage, color }: { percentage: number; color: string }) {
  return (
    <div className="w-full h-2 bg-border rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} />
    </div>
  );
}

function WeeklyDonut({ percentage, color, isDark }: { percentage: number; color: string; isDark?: boolean }) {
  const size = 100, stroke = 12, radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const trackColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }} className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size/2} cy={size/2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="transparent" />
          <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={stroke} strokeLinecap="round"
            fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </g>
      </svg>
      <div className="absolute text-sm font-bold text-foreground">{Math.round(percentage)}%</div>
    </div>
  );
}

function DailyOverview({ stats, activeDays, activeWeekIdx, activeWeekLabel, monthName }: {
  stats: { dailyCompleted: Record<number, number>; totalCompleted: number; totalPossible: number };
  activeDays: number[]; activeWeekIdx: number; activeWeekLabel: string; monthName: string;
}) {
  const maxPerDay = DEMO_HABITS.length;
  const weekIdx = activeWeekIdx % 5;
  return (
    <div className="mt-0">
      <h2 className="hidden sm:block font-semibold text-xs text-foreground mb-3 mt-4 tracking-tight uppercase" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        Daily Progress — {activeWeekLabel} · {monthName} {YEAR}
      </h2>
      <h2 className="sm:hidden font-bold text-sm text-foreground mb-3 mt-4 truncate">📊 {activeWeekLabel} · {monthName} {YEAR}</h2>
      <div className="grid grid-cols-7 gap-1.5">
        {activeDays.map(day => {
          const completed = stats.dailyCompleted[day];
          const pct = maxPerDay > 0 ? (completed / maxPerDay) * 100 : 0;
          return (
            <div key={day} className="border border-border rounded bg-card overflow-hidden shadow-sm">
              <div className={`${WEEK_COLORS_BG[weekIdx]} text-primary-foreground text-center py-1 text-[10px] font-semibold whitespace-nowrap leading-tight`}>Day {day}</div>
              <div className="p-1 space-y-0.5">
                <div className="text-center text-base font-bold text-foreground leading-tight">{completed}</div>
                <div className="text-center text-[10px] text-muted-foreground">of {maxPerDay}</div>
                <MiniBar percentage={pct} color={WEEK_HSL_COLORS[weekIdx]} />
                <div className="text-center text-[10px] font-semibold text-foreground">{Math.round(pct)}%</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-center text-sm font-semibold text-foreground">
        Monthly Total: {stats.totalCompleted} / {stats.totalPossible} ({stats.totalPossible > 0 ? Math.round((stats.totalCompleted / stats.totalPossible) * 100) : 0}%)
      </div>
    </div>
  );
}

export default function HabitTrackerPreview() {
  const [selectedMonth, setSelectedMonth] = useState("2");
  const monthInfo   = MONTHS.find(m => m.value === selectedMonth)!;
  const monthIdx    = parseInt(selectedMonth);
  const daysInMonth = monthInfo.days;
  const monthName   = monthInfo.name;

  // 10-click limit — resets on every page refresh (no persistence)
  const [clicksUsed, setClicksUsed] = useState<number>(0);
  const isLimitReached = clicksUsed >= MAX_CLICKS;

  // Mutable logs — checkboxes actually toggle within budget
  const [allLogs, setAllLogs] = useState<Record<string, LogMap>>(() => {
    const all: Record<string, LogMap> = {};
    MONTHS.forEach(m => { all[m.value] = buildDemoLogs(m.days); });
    return all;
  });
  const logs = allLogs[selectedMonth];

  const [showModal, setShowModal] = useState(false);
  const [mobileWeekIdx, setMobileWeekIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("theme") === "dark"; } catch { return false; }
  });

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
    document.documentElement.classList.toggle("dark", next);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, []); // eslint-disable-line

  const dayNames   = useMemo(() => getDayNames(monthIdx, YEAR, daysInMonth), [monthIdx, daysInMonth]);
  const weekRanges = useMemo(() => getWeekRanges(daysInMonth, monthName), [daysInMonth, monthName]);
  const activeWeek = weekRanges[mobileWeekIdx] || weekRanges[0];

  const cellBg = isDark ? WEEK_HSL_BG_DARK : WEEK_HSL_BG_LIGHT;
  const checkEmptyBorder = isDark ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(15,23,42,0.36)";

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) setMobileWeekIdx(i => Math.min(i + 1, weekRanges.length - 1));
      else setMobileWeekIdx(i => Math.max(i - 1, 0));
    }
    touchStartX.current = null; touchStartY.current = null;
  }, [weekRanges.length]);

  // Toggle a checkbox — uses click budget
  const toggle = useCallback((habitId: string, day: number) => {
    if (isLimitReached) { setShowModal(true); return; }
    const next = clicksUsed + 1;
    setClicksUsed(next);
    setAllLogs(prev => ({
      ...prev,
      [selectedMonth]: {
        ...prev[selectedMonth],
        [habitId]: { ...prev[selectedMonth][habitId], [day]: !prev[selectedMonth][habitId]?.[day] },
      },
    }));
    if (next >= MAX_CLICKS) setShowModal(true);
  }, [isLimitReached, clicksUsed, selectedMonth]);

  const showSubscribe = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowModal(true); };

  const stats = useMemo(() => {
    const dailyCompleted: Record<number, number>  = {};
    const dailyIncomplete: Record<number, number> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      let c = 0;
      DEMO_HABITS.forEach(h => { if (logs[h.id]?.[d]) c++; });
      dailyCompleted[d]  = c;
      dailyIncomplete[d] = DEMO_HABITS.length - c;
    }
    const weeklyCompleted = weekRanges.map(w => { let t = 0; w.days.forEach(d => { t += dailyCompleted[d]; }); return t; });
    const weeklyTotal     = weekRanges.map(w => w.days.length * DEMO_HABITS.length);
    const totalCompleted  = Object.values(dailyCompleted).reduce((a, b) => a + b, 0);
    const totalPossible   = daysInMonth * DEMO_HABITS.length;
    return { dailyCompleted, dailyIncomplete, weeklyCompleted, weeklyTotal, totalCompleted, totalPossible };
  }, [logs, daysInMonth, weekRanges]);

  const habitProgress = (habitId: string) => {
    let c = 0;
    for (let d = 1; d <= daysInMonth; d++) { if (logs[habitId]?.[d]) c++; }
    return c;
  };

  const remaining = MAX_CLICKS - clicksUsed;

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4" onContextMenu={e => e.preventDefault()}>
      {showModal && <SubscribeModal onClose={() => setShowModal(false)} isLimitReached={isLimitReached} />}

      {/* Preview banner */}
      <div className="flex items-center justify-center gap-2 flex-wrap text-white text-xs font-semibold rounded-lg mb-2 px-3 py-1.5" style={{ background: "#DC2626" }}>
        <span>Live preview</span>
        <span className="opacity-60">·</span>
        <span className="opacity-80">{remaining > 0 ? `${remaining} interaction${remaining === 1 ? "" : "s"} left` : "Limit reached"}</span>
        <span className="opacity-60">·</span>
        <a href={STORE_URL} target="_blank" rel="noopener noreferrer" className="underline font-bold text-white">Get full access</a>
      </div>

      {/* ── HEADER ── */}
      <div className="bg-tracker-header text-tracker-header-foreground rounded-t font-bold">
        {/* Mobile header */}
        <div className="flex sm:hidden flex-col gap-1.5 py-2 px-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm leading-tight">
              <img src="https://play-lh.googleusercontent.com/6GoMgqNIG0997uH91CHQ9H6cTH276ts2zEChCVIHonrF0m800CRowJc15XEhH1XeVng" alt="logo" className="w-5 h-5 rounded-sm object-cover" />
              {monthName} {YEAR}
            </span>
            <button onClick={toggleDark} className="text-primary-foreground bg-primary-foreground/20 hover:bg-primary-foreground/30 px-2 py-1 rounded text-sm leading-none">
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
          <select
            value={selectedMonth}
            onChange={e => { setSelectedMonth(e.target.value); setMobileWeekIdx(0); }}
            disabled
            className="flex-1 h-7 text-xs bg-primary-foreground/20 border border-primary-foreground/30 text-primary-foreground rounded px-2 opacity-60 cursor-not-allowed"
          >
            {MONTHS.map(m => <option key={m.value} value={m.value} className="text-black">{m.label}</option>)}
          </select>
        </div>
        {/* Desktop header */}
        <div className="hidden sm:grid grid-cols-3 items-center py-3 px-5" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
          <div className="flex items-center">
            <select
              value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); setMobileWeekIdx(0); }}
              disabled
              className="w-[150px] h-7 text-xs bg-primary-foreground/20 border border-primary-foreground/30 text-primary-foreground rounded px-2 opacity-60 cursor-not-allowed"
            >
              {MONTHS.map(m => <option key={m.value} value={m.value} className="text-black">{m.label}</option>)}
            </select>
          </div>
          <div className="flex justify-center">
            <span className="font-bold tracking-widest text-base text-tracker-header-foreground whitespace-nowrap uppercase" style={{ letterSpacing: "0.08em" }}>
              {monthName} {YEAR} — Habit Tracker
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={toggleDark} className="text-primary-foreground bg-primary-foreground/20 hover:bg-primary-foreground/30 px-2.5 py-1 rounded text-sm leading-none">
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE: swipeable single-week view ── */}
      <div className="sm:hidden border border-border rounded-b overflow-hidden"
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="flex items-center justify-between px-3 py-1.5"
          style={{ backgroundColor: WEEK_HSL_COLORS[mobileWeekIdx % WEEK_HSL_COLORS.length] }}>
          <button onClick={() => setMobileWeekIdx(i => Math.max(i - 1, 0))} disabled={mobileWeekIdx === 0}
            className="text-white text-lg px-2 disabled:opacity-30 select-none">‹</button>
          <span className="text-white font-semibold text-sm">{activeWeek.label} &nbsp;·&nbsp; {activeWeek.dateRange}</span>
          <button onClick={() => setMobileWeekIdx(i => Math.min(i + 1, weekRanges.length - 1))} disabled={mobileWeekIdx === weekRanges.length - 1}
            className="text-white text-lg px-2 disabled:opacity-30 select-none">›</button>
        </div>
        <div className="flex justify-center gap-1.5 py-1.5 bg-card">
          {weekRanges.map((_, wi) => (
            <button key={wi} onClick={() => setMobileWeekIdx(wi)}
              className="w-2 h-2 rounded-full transition-all"
              style={{ backgroundColor: wi === mobileWeekIdx ? WEEK_HSL_COLORS[wi % WEEK_HSL_COLORS.length] : "#d1d5db" }} />
          ))}
        </div>
        <div>
          <table className="w-full border-collapse tabular-nums table-fixed" style={{ fontSize: "11px" }}>
            <colgroup>
              <col style={{ width: "30%" }} />
              {activeWeek.days.map(d => <col key={d} style={{ width: `${70 / activeWeek.days.length}%` }} />)}
            </colgroup>
            <thead>
              <tr>
                <th className="border border-border p-1 text-left font-semibold text-foreground bg-card">Habits</th>
                {activeWeek.days.map(d => (
                  <th key={d} className="border border-border p-0.5 text-center font-medium"
                    style={{ backgroundColor: cellBg[mobileWeekIdx % cellBg.length], color: "hsl(var(--foreground))" }}>
                    <div className="font-bold leading-tight">{d}</div>
                    <div className="text-[9px] text-gray-500 font-normal leading-tight">{dayNames[d - 1]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_HABITS.map((habit, hi) => (
                <tr key={habit.id} className={hi % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                  <td className="border border-border p-1 font-medium text-foreground overflow-hidden"
                    style={{ backgroundColor: hi % 2 === 0 ? "hsl(var(--card))" : "hsl(var(--secondary) / 0.3)" }}>
                    <span className="block truncate" style={{ fontSize: "11px" }}>{hi + 1}. {habit.name}</span>
                  </td>
                  {activeWeek.days.map(d => {
                    const checked = logs[habit.id]?.[d] || false;
                    return (
                      <td key={d} className="border border-border p-0 text-center"
                        style={{ backgroundColor: cellBg[mobileWeekIdx % cellBg.length] }}>
                        <button
                          onTouchEnd={e => { e.preventDefault(); toggle(habit.id, d); }}
                          onClick={() => toggle(habit.id, d)}
                          className="w-full h-full flex items-center justify-center py-1.5"
                          style={{ cursor: isLimitReached ? "not-allowed" : "pointer" }}>
                          <span className="inline-flex w-4 h-4 rounded-sm items-center justify-center transition-all duration-150"
                            style={checked
                              ? { backgroundColor: WEEK_HSL_COLORS[mobileWeekIdx % WEEK_HSL_COLORS.length], border: "1px solid rgba(255,255,255,0.15)" }
                              : { backgroundColor: cellBg[mobileWeekIdx % cellBg.length], border: checkEmptyBorder }}>
                            {checked && <svg viewBox="0 0 12 12" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" fill="none" /></svg>}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-card">
                <td colSpan={activeWeek.days.length + 1} className="border border-border p-0">
                  <button onClick={showSubscribe}
                    className="w-full text-left px-3 py-1.5 text-xs text-primary hover:bg-primary/5 transition-colors flex items-center gap-1">
                    <span className="font-bold text-sm leading-none">+</span> Add Habit
                  </button>
                </td>
              </tr>
              <tr className="bg-secondary/50">
                <td className="border border-border p-1 font-semibold text-muted-foreground text-xxs uppercase">Done</td>
                {activeWeek.days.map(d => (
                  <td key={d} className="border border-border p-0.5 text-center font-medium text-foreground text-xs">{stats.dailyCompleted[d]}</td>
                ))}
              </tr>
              <tr className="bg-secondary/50">
                <td className="border border-border p-1 font-semibold text-muted-foreground text-xxs uppercase">Left</td>
                {activeWeek.days.map(d => (
                  <td key={d} className="border border-border p-0.5 text-center font-medium text-foreground text-xs">{stats.dailyIncomplete[d]}</td>
                ))}
              </tr>
              <tr className="bg-card">
                <td className="border border-border p-1 font-semibold text-foreground text-xs">Week Total</td>
                <td colSpan={activeWeek.days.length} className="border border-border p-1 text-center font-bold text-foreground text-xs">
                  {stats.weeklyCompleted[mobileWeekIdx]} / {stats.weeklyTotal[mobileWeekIdx]}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DESKTOP: full grid ── */}
      <div className="hidden sm:block border border-border rounded-b">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs tabular-nums min-w-[900px]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card border border-border p-1 min-w-[140px]"></th>
                {weekRanges.map((w, wi) => (
                  <th key={w.label} colSpan={w.days.length} className="border border-border p-1.5 text-center font-semibold text-xs uppercase tracking-wider overflow-hidden"
                    style={{ backgroundColor: WEEK_HSL_COLORS[wi % WEEK_HSL_COLORS.length], color: "#fff", minWidth: `${w.days.length * 28}px` }}>
                    {w.label}
                  </th>
                ))}
                <th className="bg-card border border-border p-1.5 text-center font-semibold text-foreground text-xs uppercase tracking-wide" rowSpan={2}>Goal</th>
                <th className="bg-card border border-border p-1.5 text-center font-semibold text-foreground text-xs uppercase tracking-wide" rowSpan={2}>Progress</th>
              </tr>
              <tr>
                <th className="sticky left-0 z-10 bg-card border border-border p-1.5 text-left font-semibold text-foreground text-xs uppercase tracking-wide">Habits</th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                  const weekIdx = weekRanges.findIndex(w => w.days.includes(d));
                  return (
                    <th key={d} className="border border-border p-0.5 text-center font-medium"
                      style={{ backgroundColor: cellBg[weekIdx % cellBg.length], color: "hsl(var(--foreground))" }}>
                      <div>{d}</div>
                    </th>
                  );
                })}
              </tr>
              <tr>
                <th className="sticky left-0 z-10 bg-card border border-border p-1.5 text-left text-muted-foreground font-medium text-xs">Days</th>
                {dayNames.map((dn, i) => {
                  const weekIdx = weekRanges.findIndex(w => w.days.includes(i + 1));
                  return (
                    <th key={i} className="border border-border p-0.5 text-center font-normal"
                      style={{ backgroundColor: cellBg[weekIdx % cellBg.length], color: "hsl(var(--muted-foreground))" }}>
                      {dn}
                    </th>
                  );
                })}
                <th className="bg-card border border-border p-1"></th>
                <th className="bg-card border border-border p-1"></th>
              </tr>
            </thead>
            <tbody>
              {DEMO_HABITS.map((habit, hi) => {
                const completed = habitProgress(habit.id);
                const goal = daysInMonth;
                const pct = goal > 0 ? Math.min((completed / goal) * 100, 100) : 0;
                const color = WEEK_HSL_COLORS[hi % WEEK_HSL_COLORS.length];
                return (
                  <tr key={habit.id} className={hi % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                    <td className="sticky left-0 z-10 border border-border p-1.5 font-medium text-foreground whitespace-nowrap text-xs"
                      style={{ backgroundColor: hi % 2 === 0 ? "hsl(var(--card))" : "hsl(var(--secondary) / 0.3)" }}>
                      {hi + 1}. {habit.name}
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                      const checked  = logs[habit.id]?.[d] || false;
                      const weekIdx  = weekRanges.findIndex(w => w.days.includes(d));
                      return (
                        <td key={d} className="border border-border p-0 text-center"
                          style={{ backgroundColor: cellBg[weekIdx % cellBg.length] }}>
                          <button
                            onClick={() => toggle(habit.id, d)}
                            className="w-full h-full flex items-center justify-center p-0.5 focus:outline-none"
                            style={{ cursor: isLimitReached ? "not-allowed" : "pointer" }}>
                            <span className="inline-flex w-3.5 h-3.5 rounded-sm items-center justify-center transition-all duration-150"
                              style={checked
                                ? { backgroundColor: WEEK_HSL_COLORS[weekIdx % WEEK_HSL_COLORS.length], border: "1px solid rgba(255,255,255,0.15)" }
                                : { backgroundColor: cellBg[weekIdx % cellBg.length], border: checkEmptyBorder }}>
                              {checked && <svg viewBox="0 0 12 12" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" fill="none" /></svg>}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                    <td className="border border-border p-1 text-center font-medium text-foreground">{goal}</td>
                    <td className="border border-border p-1 text-center font-medium text-foreground">
                      <div className="w-28 mx-auto">
                        <MiniBar percentage={pct} color={color} />
                        <div className="text-xxs text-muted-foreground mt-0.5">{Math.round(pct)}%</div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              <tr className="bg-card">
                <td colSpan={daysInMonth + 3} className="sticky left-0 border border-border p-0">
                  <button onClick={showSubscribe}
                    className="w-full text-left px-3 py-1.5 text-xs text-primary hover:bg-primary/5 transition-colors flex items-center gap-1">
                    <span className="font-bold text-sm leading-none">+</span> Add Habit
                  </button>
                </td>
              </tr>

              <tr><td colSpan={daysInMonth + 3} className="border border-border p-1 bg-card h-2"></td></tr>

              <tr className="bg-secondary/50">
                <td className="sticky left-0 z-10 bg-secondary/50 border border-border p-1.5 font-semibold text-foreground text-xs tracking-wide uppercase text-muted-foreground">Completed</td>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <td key={i} className="border border-border p-0.5 text-center font-medium text-foreground">{stats.dailyCompleted[i + 1]}</td>
                ))}
                <td className="border border-border p-1"></td>
                <td className="border border-border p-1 text-center font-bold text-foreground">{stats.totalCompleted}</td>
              </tr>
              <tr className="bg-secondary/50">
                <td className="sticky left-0 z-10 bg-secondary/50 border border-border p-1.5 font-semibold text-foreground text-xs tracking-wide uppercase text-muted-foreground">Incomplete</td>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <td key={i} className="border border-border p-0.5 text-center font-medium text-foreground">{stats.dailyIncomplete[i + 1]}</td>
                ))}
                <td className="border border-border p-1"></td>
                <td className="border border-border p-1 text-center font-bold text-foreground">{stats.totalPossible - stats.totalCompleted}</td>
              </tr>
              <tr className="bg-card">
                <td className="sticky left-0 z-10 bg-card border border-border p-1 font-semibold text-foreground">Weekly Completed</td>
                {weekRanges.map((w, wi) => (
                  <td key={wi} colSpan={w.days.length} className="border border-border p-1 text-center font-bold text-foreground">{stats.weeklyCompleted[wi]}</td>
                ))}
                <td className="border border-border p-1"></td>
                <td className="border border-border p-1 text-center text-muted-foreground text-xxs">Total Monthly Progress</td>
              </tr>
              <tr className="bg-card">
                <td className="sticky left-0 z-10 bg-card border border-border p-1 font-semibold text-foreground">Weekly Incomplete</td>
                {weekRanges.map((w, wi) => (
                  <td key={wi} colSpan={w.days.length} className="border border-border p-1 text-center font-bold text-foreground">{stats.weeklyTotal[wi] - stats.weeklyCompleted[wi]}</td>
                ))}
                <td className="border border-border p-1"></td>
                <td className="border border-border p-1 text-center font-bold text-foreground">{stats.totalCompleted}/{stats.totalPossible}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── WEEKLY PROGRESS ── */}
      <section className="mt-4">
        <h2 className="hidden sm:block font-semibold text-xs text-foreground mb-3 tracking-tight uppercase">Progress per Week</h2>
        <h2 className="sm:hidden font-bold text-sm text-foreground mb-3">📈 Progress per Week</h2>
        <div className="flex flex-wrap justify-center gap-14">
          {weekRanges.map((w, wi) => {
            const completed = stats.weeklyCompleted[wi] || 0;
            const total     = stats.weeklyTotal[wi] || (w.days.length * DEMO_HABITS.length);
            const pct       = total > 0 ? (completed / total) * 100 : 0;
            return (
              <div key={wi} className="flex flex-col items-center gap-3">
                <WeeklyDonut percentage={pct} color={WEEK_HSL_COLORS[wi % WEEK_HSL_COLORS.length]} isDark={isDark} />
                <div className="text-xs text-muted-foreground text-center font-medium">{w.dateRange}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── DESKTOP WEEK NAV for daily overview ── */}
      <div className="hidden sm:flex items-center justify-between mt-5 px-4 py-2 rounded-t"
        style={{ backgroundColor: WEEK_HSL_COLORS[mobileWeekIdx % WEEK_HSL_COLORS.length] }}>
        <button onClick={() => setMobileWeekIdx(i => Math.max(i - 1, 0))} disabled={mobileWeekIdx === 0}
          className="text-white text-xl px-3 py-0.5 rounded hover:bg-white/10 disabled:opacity-30 select-none">‹</button>
        <div className="flex items-center gap-4">
          <span className="text-white font-semibold text-sm tracking-tight">{activeWeek.label} &nbsp;·&nbsp; {activeWeek.dateRange}</span>
          <div className="flex gap-1.5">
            {weekRanges.map((_, wi) => (
              <button key={wi} onClick={() => setMobileWeekIdx(wi)}
                className="w-2 h-2 rounded-full transition-all"
                style={{ backgroundColor: wi === mobileWeekIdx ? "#fff" : "rgba(255,255,255,0.35)" }} />
            ))}
          </div>
        </div>
        <button onClick={() => setMobileWeekIdx(i => Math.min(i + 1, weekRanges.length - 1))} disabled={mobileWeekIdx === weekRanges.length - 1}
          className="text-white text-xl px-3 py-0.5 rounded hover:bg-white/10 disabled:opacity-30 select-none">›</button>
      </div>

      <DailyOverview stats={stats} activeDays={activeWeek.days} activeWeekIdx={mobileWeekIdx} activeWeekLabel={activeWeek.label} monthName={monthName} />
    </div>
  );
}
