import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import { EmojiFloat } from "../components/EmojiFloat";
import { DetailRow } from "../components/DetailRow";
import { assets } from "../figmaAssets";
import { getEvent, type EventRow } from "../lib/supabase";
import styles from "./EventScreen.module.css";

const EFFECT_EMOJIS: (string | null)[] = [
  null, "🎉", "🍷", "💕", "💋", "⛽️", "🤝", "💸", "🌸", "🤡", "🍄",
];

function getCoverSrc(event: EventRow): string {
  if (event.cover_url) return event.cover_url;
  const map = [
    assets.heroBackground,
    assets.thumb1,
    assets.thumb2,
    assets.thumb3b,
    assets.thumb4,
    assets.thumb5a,
  ];
  return map[event.thumbnail_index] ?? assets.heroBackground;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function formatDate(startIso: string, endIso: string | null): string {
  const start = new Date(startIso);
  const base = start.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  if (endIso) {
    const end = new Date(endIso);
    if (start.toDateString() !== end.toDateString()) {
      const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
      const endStr = sameMonth
        ? String(end.getDate())
        : end.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      return `${base} – ${endStr}`;
    }
  }
  return base;
}

function formatTime(startIso: string, endIso: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  return endIso ? `${fmt(startIso)} – ${fmt(endIso)}` : fmt(startIso);
}

type RsvpStatus = "going" | "maybe" | "cantgo";

const RSVP_OPTIONS: { status: RsvpStatus; emoji: string; label: string }[] = [
  { status: "going",   emoji: "🔥", label: "Going"    },
  { status: "maybe",   emoji: "🤔", label: "Maybe"    },
  { status: "cantgo",  emoji: "😢", label: "Can't Go" },
];

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

function useMapCoords(location: string | undefined) {
  const [coords, setCoords] = useState<{ lng: number; lat: number } | null>(null);
  useEffect(() => {
    if (!location || !MAPBOX_TOKEN) return;
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?limit=1&access_token=${MAPBOX_TOKEN}`
    )
      .then((r) => r.json())
      .then((d) => {
        const center = d.features?.[0]?.center as [number, number] | undefined;
        if (center) setCoords({ lng: center[0], lat: center[1] });
      })
      .catch(() => {});
  }, [location]);
  return coords;
}

export function EventScreen() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const transitionState = location.state as { coverSrc?: string; location?: string } | null;
  const transitionCover = transitionState?.coverSrc;
  const transitionLocation = transitionState?.location;
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getEvent(id).then((ev) => {
      setEvent(ev);
      setLoading(false);
    });
  }, [id]);

  const mapCoords = useMapCoords(transitionLocation ?? event?.location);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const check = () => setIsClamped(el.scrollHeight > el.clientHeight);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [event?.description]);


  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const handleInvite = async () => {
    await navigator.clipboard.writeText(window.location.href);
    showToast("Invite link copied!");
  };

  if (loading) return (
    <div className={styles.root}>
      <div className={styles.ambient} aria-hidden>
        <div className={styles.ambientBlur} style={transitionCover ? { backgroundImage: `url("${transitionCover}")` } : undefined} />
      </div>
    </div>
  );
  if (!event) return (
    <div className={styles.root}>
      <div className={styles.ambient} aria-hidden>
        <div className={styles.ambientBlur} />
      </div>
    </div>
  );

  const effectEmoji = EFFECT_EMOJIS[event.effect_index] ?? null;
  const coverSrc    = getCoverSrc(event);
  const rsvpEmoji   = rsvpStatus ? (RSVP_OPTIONS.find((o) => o.status === rsvpStatus)?.emoji ?? "🔥") : "🔥";

  return (
    <div className={styles.root}>
      <div className={styles.ambient} aria-hidden>
        <div className={styles.ambientBlur} style={{ backgroundImage: `url("${coverSrc}")` }} />
      </div>

      {effectEmoji && <EmojiFloat emoji={effectEmoji} count={8} />}

      <div className={styles.shell}>
        <div className={styles.grid}>
          {/* ── Left: info ── */}
          <section className={styles.infoColumn}>
            <div className={styles.hostsRow}>
              {event.hosts.map((host, i) => (
                <div key={i} className={styles.hostChip}>
                  <span className={styles.hostAvatar}>{getInitials(host)}</span>
                  <span className={styles.hostName}>{host}</span>
                </div>
              ))}
            </div>

            <h1 className={styles.title}>{event.title}</h1>

            <DetailRow
              icon={<Calendar size={20} />}
              primary={formatDate(event.start_at, event.end_at)}
              secondary={formatTime(event.start_at, event.end_at)}
            />

            {event.location && (
              <DetailRow
                icon={<MapPin size={20} />}
                primary={event.location}
                secondary={event.location}
                href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
              />
            )}

            {event.location && (
              <div className={styles.mapWrap}>
                {mapCoords && MAPBOX_TOKEN ? (
                  <img
                    className={styles.map}
                    src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${mapCoords.lng},${mapCoords.lat},14/900x432@2x?access_token=${MAPBOX_TOKEN}`}
                    alt="Event location map"
                    loading="lazy"
                  />
                ) : (
                  <iframe
                    className={styles.map}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`}
                    title="Event location"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}
              </div>
            )}

            {event.description && (
              <div className={styles.about}>
                <div className={styles.aboutLabel}>About</div>
                <p ref={descRef} className={`${styles.aboutText} ${descExpanded ? styles.aboutExpanded : ""}`}>
                  {event.description}
                </p>
                {(isClamped || descExpanded) && (
                  <button type="button" className={styles.seeMore} onClick={() => setDescExpanded((v) => !v)}>
                    {descExpanded ? "See Less" : "See More"}
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ── Right: cover + actions ── */}
          <aside className={styles.mediaColumn}>
            <div className={styles.cover}>
              <img src={coverSrc} alt={event.title} />
            </div>

            <div className={styles.actions}>
              <div className={styles.actionItem}>
                <div className={styles.rsvpWrap}>
                  {pickerOpen && (
                    <div className={styles.rsvpBackdrop} onClick={() => setPickerOpen(false)} />
                  )}
                  {pickerOpen && (
                    <div className={styles.rsvpPicker}>
                      {RSVP_OPTIONS.map((opt) => (
                        <button
                          key={opt.status}
                          type="button"
                          className={`${styles.rsvpOption} ${rsvpStatus === opt.status ? styles.rsvpOptionActive : ""}`}
                          onClick={() => { setRsvpStatus(opt.status); setPickerOpen(false); }}
                        >
                          <span className={styles.rsvpOptionEmoji}>{opt.emoji}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.rsvpBtn}
                    aria-label="RSVP to this event"
                    onClick={() => setPickerOpen((o) => !o)}
                  >
                    <span key={rsvpStatus} className={styles.rsvpEmoji}>
                      {rsvpEmoji}
                    </span>
                  </button>
                </div>
                <span className={styles.actionLabel}>
                  {rsvpStatus ? RSVP_OPTIONS.find((o) => o.status === rsvpStatus)?.label : "RSVP"}
                </span>
              </div>

              <div className={styles.actionItem}>
                <button
                  type="button"
                  className={styles.inviteBtn}
                  aria-label="Share invite link"
                  onClick={handleInvite}
                >
                  <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
                    <path d="M9 13V1M9 1L5 5M9 1L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M1 14V17C1 18.1046 1.89543 19 3 19H15C16.1046 19 17 18.1046 17 17V14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <span className={styles.actionLabel}>Invite</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {toast && <div className={styles.toast} role="status">{toast}</div>}

    </div>
  );
}
