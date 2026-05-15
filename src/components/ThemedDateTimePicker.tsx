import { useEffect, useId, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { parseLocalInput, toLocalInputValue } from "../lib/dateTimeLocal";
import styles from "./ThemedDateTimePicker.module.css";

type TimeSlot = { hour24: number; minute: number; label: string };

const TIME_SLOTS: TimeSlot[] = (() => {
  const slots: TimeSlot[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      slots.push({ hour24: h, minute: m, label: `${h12}:${String(m).padStart(2, "0")}${ampm}` });
    }
  }
  return slots;
})();

function nextSnap(): Date {
  const d = new Date();
  const rem = d.getMinutes() % 15;
  d.setMinutes(d.getMinutes() + (rem === 0 ? 0 : 15 - rem), 0, 0);
  return d;
}

function formatTriggerLabel(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const w = days[d.getDay()] ?? "—";
  const mon = months[d.getMonth()] ?? "";
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  return `${w}, ${mon} ${d.getDate()} ${h}:${String(m).padStart(2, "0")}${ap}`;
}

export type ThemedDateTimePickerProps = {
  value?: string;
  defaultValue?: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  autoOpen?: boolean;
  onClose?: () => void;
};

export function ThemedDateTimePicker({ value, defaultValue, onChange, ariaLabel, autoOpen, onClose }: ThemedDateTimePickerProps) {
  const popoverId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeListRef = useRef<HTMLDivElement>(null);

  const hasValue = value !== undefined;
  const [open, setOpen] = useState(autoOpen ?? false);
  const parsed = useMemo(() => (value ? parseLocalInput(value) : new Date()), [value]);

  const displayDate = useMemo(
    () => (hasValue ? parsed : (defaultValue ? parseLocalInput(defaultValue) : nextSnap())),
    [hasValue, parsed, defaultValue],
  );

  const [viewMonth, setViewMonth] = useState(
    () => new Date(displayDate.getFullYear(), displayDate.getMonth(), 1),
  );

  const closePopover = () => { setOpen(false); onClose?.(); };

  const selectedSlotIdx = useMemo(() => {
    const total = displayDate.getHours() * 60 + displayDate.getMinutes();
    return Math.min(Math.round(total / 15), TIME_SLOTS.length - 1);
  }, [displayDate]);

  useEffect(() => {
    if (open) setViewMonth(new Date(displayDate.getFullYear(), displayDate.getMonth(), 1));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !timeListRef.current) return;
    const list = timeListRef.current;
    const btn = list.children[selectedSlotIdx] as HTMLElement | undefined;
    if (!btn) return;
    list.scrollTop = btn.offsetTop - list.clientHeight / 2 + btn.offsetHeight / 2;
  }, [open, selectedSlotIdx]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      const t = (e instanceof TouchEvent ? e.touches[0]?.target : e.target) as Node | null;
      if (t && !anchorRef.current?.contains(t) && !popoverRef.current?.contains(t)) closePopover();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePopover(); };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const next = new Date(displayDate);
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    onChange(toLocalInputValue(next));
  };

  const onPickSlot = (slot: TimeSlot) => {
    const next = new Date(displayDate);
    next.setHours(slot.hour24, slot.minute, 0, 0);
    onChange(toLocalInputValue(next));
  };

  return (
    <div className={styles.anchor} ref={anchorRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""} ${!hasValue ? styles.triggerEmpty : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? popoverId : undefined}
        aria-label={ariaLabel}
        onClick={() => {
          if (!hasValue && defaultValue) onChange(defaultValue);
          else setOpen((o) => !o);
        }}
      >
        {hasValue ? formatTriggerLabel(parsed) : "Add End-Time"}
      </button>

      {open && (
        <div
          ref={popoverRef}
          id={popoverId}
          className={styles.popover}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.popoverBody}>
            <DayPicker
              mode="single"
              selected={hasValue ? parsed : undefined}
              onSelect={handleDaySelect}
              month={viewMonth}
              onMonthChange={setViewMonth}
              showOutsideDays={false}
              formatters={{
                formatWeekdayName: (d) =>
                  (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const)[d.getDay()] ?? "",
              }}
              classNames={{
                root: styles.calRoot,
                months: styles.calMonths,
                month: styles.calendarPanel,
                month_grid: styles.calGrid,
                weekday: styles.weekday,
                day: styles.dayCell,
                day_button: styles.dayBtn,
                selected: styles.daySelected,
                outside: styles.dayOutside,
                hidden: styles.dayHidden,
                today: styles.dayToday,
              }}
              components={{
                Nav: () => <></>,
                MonthCaption: ({ calendarMonth }) => {
                  const d = calendarMonth.date;
                  const title = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(d);
                  return (
                    <div className={styles.popoverHeader}>
                      <button
                        type="button"
                        className={styles.navBtn}
                        aria-label="Previous month"
                        onClick={() => setViewMonth(new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                      >‹</button>
                      <p className={styles.monthLabel}>{title}</p>
                      <button
                        type="button"
                        className={styles.navBtn}
                        aria-label="Next month"
                        onClick={() => setViewMonth(new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                      >›</button>
                    </div>
                  );
                },
              }}
            />

            <div className={styles.timePanel}>
              <div className={styles.timeSlotList} ref={timeListRef}>
                {TIME_SLOTS.map((slot, idx) => (
                  <button
                    key={slot.label}
                    type="button"
                    className={`${styles.timeSlot} ${idx === selectedSlotIdx ? styles.timeSlotSelected : ""}`}
                    onClick={() => onPickSlot(slot)}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
