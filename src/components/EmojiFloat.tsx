import { useMemo } from "react";
import type { CSSProperties } from "react";
import styles from "./EmojiFloat.module.css";

type Instance = {
  id: number;
  startX: number;
  sizePx: number;
  riseDur: number;
  swayDur: number;
  delaySec: number;
  maxOp: number;
  swayA: number;
  swayB: number;
};

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function buildInstances(count: number): Instance[] {
  // One emoji per horizontal slot so they spread evenly across the width
  const slotW = 100 / count;
  return Array.from({ length: count }, (_, i) => {
    const riseDur = rnd(10, 18);
    const swayAmt = Math.round(rnd(30, 70));
    return {
      id: i,
      startX: i * slotW + 4 + Math.random() * (slotW - 8),
      sizePx: Math.round(rnd(32, 56)),
      riseDur,
      swayDur: rnd(3, 10),
      delaySec: -Math.random() * riseDur,
      maxOp: rnd(0.7, 1.0),
      swayA: swayAmt,
      swayB: -Math.round(swayAmt * (0.5 + Math.random() * 0.4)),
    };
  });
}

type Props = {
  emoji: string;
  count?: number;
};

/**
 * Drop inside any `position: relative` container.
 *
 * @example
 * <div style={{ position: "relative", minHeight: "100vh" }}>
 *   <EmojiFloat emoji="🍷" count={8} />
 *   <EventDetails />
 * </div>
 */
export function EmojiFloat({ emoji, count = 7 }: Props) {
  const instances = useMemo(() => buildInstances(count), [count]);

  return (
    <div className={styles.layer} aria-hidden>
      {instances.map((f) => (
        <span
          key={f.id}
          className={styles.floaterRiser}
          style={{
            left: `${f.startX}%`,
            fontSize: `${f.sizePx}px`,
            animationDuration: `${f.riseDur}s`,
            animationDelay: `${f.delaySec}s`,
            "--ef-max-op": f.maxOp,
          } as CSSProperties}
        >
          <span
            className={styles.floaterSwayer}
            style={{
              animationDuration: `${f.swayDur}s`,
              "--ef-sw-a": `${f.swayA}px`,
              "--ef-sw-b": `${f.swayB}px`,
            } as CSSProperties}
          >
            {emoji}
          </span>
        </span>
      ))}
    </div>
  );
}
