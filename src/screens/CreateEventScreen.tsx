import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteButton } from "../components/DeleteButton";
import { Modal } from "../components/Modal";
import { PhotoPickerPanel } from "../components/PhotoPickerPanel";
import { ThemedDateTimePicker } from "../components/ThemedDateTimePicker";
import { assets } from "../figmaAssets";
import { addHours, defaultStartToday } from "../lib/dateTimeLocal";
import { newId, supabase, uploadCoverImage, type EventInsert } from "../lib/supabase";
import styles from "./CreateEventScreen.module.css";

type EffectItem =
  | { type: "clear" }
  | { type: "emoji"; char: string; faded?: boolean };

const EFFECTS: readonly EffectItem[] = [
  { type: "clear" },
  { type: "emoji", char: "🎉" },
  { type: "emoji", char: "🍷" },
  { type: "emoji", char: "💕" },
  { type: "emoji", char: "💋" },
  { type: "emoji", char: "⛽️" },
  { type: "emoji", char: "🤝" },
  { type: "emoji", char: "💸" },
  { type: "emoji", char: "🌸" },
  { type: "emoji", char: "🤡" },
  { type: "emoji", char: "🍄" },
];

type ThumbnailModel =
  | { id: string; kind: "placeholder" }
  | { id: string; kind: "image"; src: string; opacityClass?: string; fadeOverlay?: boolean }
  | { id: string; kind: "stack"; back: string; front: string; opacityClass?: string };

const THUMBNAILS: ThumbnailModel[] = [
  { id: "ph", kind: "placeholder" },
  { id: "t1", kind: "image", src: assets.thumb1 },
  { id: "t2", kind: "image", src: assets.thumb2 },
  { id: "t3", kind: "stack", back: assets.thumb3a, front: assets.thumb3b },
  { id: "t4", kind: "image", src: assets.thumb4, opacityClass: styles.thumbOpacity80 },
  {
    id: "t5",
    kind: "image",
    src: assets.thumb5a,
    opacityClass: styles.thumbOpacity40,
    fadeOverlay: true,
  },
];

function heroForThumbnail(index: number): string {
  const model = THUMBNAILS[index];
  if (!model || model.kind === "placeholder") {
    return assets.heroBackground;
  }
  if (model.kind === "image") {
    return model.src;
  }
  return model.front;
}

type FloaterConfig = {
  id: number;
  startX: number;
  sizePx: number;
  riseDur: number;
  swayDur: number;
  delaySec: number;
  swayA: number;
  swayB: number;
  rotA: number;
  rotB: number;
  rotC: number;
  scaleA: number;
  scaleB: number;
};

const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const rndInt = (min: number, max: number) => Math.round(rnd(min, max));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

function buildFloaters(): FloaterConfig[] {
  const n = 7 + Math.floor(Math.random() * 7); // 7–13 floaters
  const slotW = 100 / n;
  return Array.from({ length: n }, (_, i) => {
    const riseDur = rnd(7, 22);
    const swayAmt = rndInt(25, 80);
    const swaySign = pick([-1, 1]);
    return {
      id: i,
      startX: i * slotW + 2 + Math.random() * (slotW - 4),
      sizePx: rndInt(22, 58),
      riseDur,
      swayDur: rnd(2, 9),
      delaySec: -Math.random() * riseDur,
      swayA: swaySign * swayAmt,
      swayB: -swaySign * rndInt(Math.round(swayAmt * 0.4), Math.round(swayAmt * 0.9)),
      rotA: rndInt(-28, 28),
      rotB: rndInt(-28, 28),
      rotC: rndInt(-28, 28),
      scaleA: parseFloat(rnd(0.85, 1.2).toFixed(2)),
      scaleB: parseFloat(rnd(0.85, 1.2).toFixed(2)),
    };
  });
}

export type CreateEventPayload = {
  eventTitle: string;
  hosts: string[];
  startAt: string;
  endAt: string | null;
  location: string;
  description: string;
  selectedEffectIndex: number;
  selectedThumbnailIndex: number;
  coverUrl: string | null;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function CreateEventScreen() {
  const navigate = useNavigate();
  const titleId = useId();

  const [eventTitle, setEventTitle] = useState("");
  const [hosts, setHosts] = useState<string[]>([]);
  const [addingHost, setAddingHost] = useState(false);
  const [hostDraft, setHostDraft] = useState("");
  const [startAt, setStartAt] = useState(defaultStartToday);
  const [endAt, setEndAt] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedThumb, setSelectedThumb] = useState(1);
  const [selectedEffect, setSelectedEffect] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelectedUrl, setPickerSelectedUrl] = useState<string | null>(null);
  const [pickerSelectedFile, setPickerSelectedFile] = useState<File | null>(null);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [descDraft, setDescDraft] = useState("");

  const hostInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingHost) hostInputRef.current?.focus();
  }, [addingHost]);

  const floaterLayouts = useMemo(() => buildFloaters(), []);

  const selectedEffectItem = EFFECTS[selectedEffect] ?? EFFECTS[0];
  const floaterEmoji =
    selectedEffectItem.type === "emoji"
      ? { char: selectedEffectItem.char, faded: Boolean(selectedEffectItem.faded) }
      : null;

  const heroSrc = useMemo(
    () => pickerSelectedUrl ?? heroForThumbnail(selectedThumb),
    [pickerSelectedUrl, selectedThumb],
  );

  const handleSelectThumb = (index: number) => {
    setSelectedThumb(index);
    setPickerSelectedUrl(null);
    setPickerSelectedFile(null);
  };

  const canSubmit = eventTitle.trim().length > 0 && hosts.length > 0;

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const handleCreate = async () => {
    if (!canSubmit || creating) return;
    setCreating(true);

    const payload: CreateEventPayload = {
      eventTitle: eventTitle.trim(),
      hosts: [...hosts],
      startAt,
      endAt: endAt && endAt.trim() ? endAt : null,
      location: location.trim(),
      description: description.trim(),
      selectedEffectIndex: selectedEffect,
      selectedThumbnailIndex: selectedThumb,
      coverUrl: pickerSelectedUrl,
    };

    const row: EventInsert = {
      id: newId(),
      title: payload.eventTitle,
      hosts: payload.hosts,
      start_at: new Date(payload.startAt).toISOString(),
      end_at: payload.endAt ? new Date(payload.endAt).toISOString() : null,
      location: payload.location,
      description: payload.description,
      effect_index: payload.selectedEffectIndex,
      thumbnail_index: payload.selectedThumbnailIndex,
      cover_url: payload.coverUrl,
    };

    if (pickerSelectedFile) {
      try {
        row.cover_url = await uploadCoverImage(pickerSelectedFile);
      } catch (err) {
        console.error("cover_upload error", err);
        showToast("Image upload failed. Try again.");
        setCreating(false);
        return;
      }
    }

    const { error } = await supabase.from("events").insert(row);

    if (error) {
      console.error("create_event error", error);
      showToast(`Error: ${error.message}`);
      setCreating(false);
    } else {
      navigate(`/events/${row.id}`, { state: { coverSrc: heroSrc } });
    }
  };

  const commitHost = useCallback(() => {
    const name = hostDraft.trim();
    if (name) setHosts((prev) => [...prev, name]);
    setHostDraft("");
    setAddingHost(false);
  }, [hostDraft]);

  const removeHost = (index: number) => {
    setHosts((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.root} data-name="Default - start create event">
      <div className={styles.ambient} aria-hidden>
        <div
          className={styles.ambientBlur}
          style={{ backgroundImage: `url("${heroSrc}")` }}
        />
      </div>

      {floaterEmoji ? (
        <div className={styles.pageFloaters} aria-hidden>
          {floaterLayouts.map((f) => {
            const riserStyle = {
              left: `${f.startX}%`,
              fontSize: `${f.sizePx}px`,
              animationDuration: `${f.riseDur}s`,
              animationDelay: `${f.delaySec}s`,
              "--ef-max-op": floaterEmoji.faded ? "0.4" : "0.9",
            } as CSSProperties;
            const swayerStyle = {
              animationDuration: `${f.swayDur}s`,
              "--ef-sw-a": `${f.swayA}px`,
              "--ef-sw-b": `${f.swayB}px`,
              "--ef-rot-a": `${f.rotA}deg`,
              "--ef-rot-b": `${f.rotB}deg`,
              "--ef-rot-c": `${f.rotC}deg`,
              "--ef-sc-a": f.scaleA,
              "--ef-sc-b": f.scaleB,
            } as CSSProperties;
            return (
              <span
                key={`${f.id}-${selectedEffect}`}
                className={styles.floaterRiser}
                style={riserStyle}
              >
                <span className={styles.floaterSwayer} style={swayerStyle}>
                  {floaterEmoji.char}
                </span>
              </span>
            );
          })}
        </div>
      ) : null}

      <div className={styles.shell}>
        <div className={styles.columns}>
          <section className={styles.formColumn} aria-labelledby={titleId}>
            <header className={styles.titleBlock}>
              <label className={styles.titleInputWrap} htmlFor={titleId}>
                <span className={styles.srOnly}>Event title (required)</span>
                <span
                  className={styles.titleInputAutosize}
                  data-value={eventTitle || "Event Title*"}
                >
                  <input
                    id={titleId}
                    className={styles.titleInput}
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    autoComplete="off"
                    maxLength={200}
                  />
                  {!eventTitle && (
                    <span className={styles.titlePlaceholder} aria-hidden>
                      Event Title<span className={styles.titleRequired}>*</span>
                    </span>
                  )}
                </span>
              </label>
            </header>

            <div className={styles.formFields}>
              <div className={styles.groupedRow}>
                <div className={styles.hostCard}>
                  {hosts.map((name, index) => (
                    <div key={`host-${index}`} className={styles.hostRow}>
                      <span className={styles.hostAvatar} aria-hidden="true">
                        {getInitials(name)}
                      </span>
                      <span className={styles.hostRowName}>{name}</span>
                      <DeleteButton
                        label={`Remove ${name}`}
                        onClick={() => removeHost(index)}
                      />
                    </div>
                  ))}
                  {addingHost ? (
                    <div className={styles.hostInputRow}>
                      <span className={styles.hostAddIcon} aria-hidden="true">
                        <img src={assets.iconAddHost} width="14" height="14" alt="" aria-hidden="true" />
                      </span>
                      <input
                        ref={hostInputRef}
                        type="text"
                        className={styles.hostAddInput}
                        value={hostDraft}
                        onChange={(e) => setHostDraft(e.target.value)}
                        placeholder="Host name"
                        aria-label="Host name"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); commitHost(); }
                          if (e.key === "Escape") { setAddingHost(false); setHostDraft(""); }
                        }}
                        onBlur={commitHost}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.hostAddRow}
                      aria-label={hosts.length === 0 ? "Add host (required)" : "Add another host"}
                      onClick={() => setAddingHost(true)}
                    >
                      <span className={styles.hostAddIcon} aria-hidden="true">
                        <img src={assets.iconAddHost} width="14" height="14" alt="" aria-hidden="true" />
                      </span>
                      <span className={styles.hostAddLabel}>
                        Add Host
                        {hosts.length === 0 && <span className={styles.requiredMark} aria-hidden="true"> *</span>}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.scheduleWrap}>
                <div className={styles.scheduleCard}>
                  <div className={styles.scheduleRow}>
                    <div className={styles.timeline} aria-hidden="true">
                      <img src={assets.iconTimeline} width="7" height="60" alt="" />
                    </div>
                    <div className={styles.scheduleMid}>
                      <div className={styles.scheduleLabel}>Starts</div>
                      <div className={styles.scheduleLabel}>Ends</div>
                    </div>
                    <div className={styles.scheduleSide}>
                      <ThemedDateTimePicker value={startAt} onChange={setStartAt} ariaLabel="Start date and time" />
                      <div className={styles.endTimeRow}>
                        <ThemedDateTimePicker
                          value={endAt ?? undefined}
                          defaultValue={addHours(startAt, 3)}
                          onChange={setEndAt}
                          ariaLabel="End date and time"
                        />
                        {endAt !== null && (
                          <DeleteButton
                            label="Remove end time"
                            onClick={() => setEndAt(null)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.groupedRow}>
                <div className={styles.rowSurfaceInput}>
                  <span className={styles.rowIcon}>
                    <img src={assets.iconLocation} width="12" height="16" alt="" aria-hidden="true" />
                  </span>
                  <input
                    className={styles.rowInputPlain}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location"
                    autoComplete="street-address"
                    aria-label="Location name"
                  />
                </div>
              </div>

              <div className={styles.groupedRow}>
                <button
                  type="button"
                  className={styles.rowSurface}
                  aria-label="Add description"
                  onClick={() => { setDescDraft(description); setDescModalOpen(true); }}
                >
                  <span className={styles.rowIcon}>
                    <img src={assets.iconDescription} width="12" height="16" alt="" aria-hidden="true" />
                  </span>
                  <span className={`${styles.rowLabel} ${description ? "" : styles.rowLabelSecondary}`}>
                    {description || "Add description"}
                  </span>
                </button>
              </div>

              <div className={styles.groupedRow}>
              <div className={styles.effectStrip} role="toolbar" aria-label="Event effect">
                {EFFECTS.map((item, index) => {
                  const selected = selectedEffect === index;
                  if (item.type === "clear") {
                    return (
                      <button
                        key={`effect-${index}`}
                        type="button"
                        className={`${styles.effectClear} ${selected ? styles.effectButtonSelected : ""}`}
                        aria-pressed={selected}
                        onClick={() => setSelectedEffect(index)}
                      />
                    );
                  }
                  return (
                    <button
                      key={`effect-${index}`}
                      type="button"
                      className={`${styles.effectButton} ${selected ? styles.effectButtonSelected : ""} ${item.faded ? styles.effectButtonMuted : ""}`}
                      aria-pressed={selected}
                      aria-label={`Select ${item.char} effect`}
                      onClick={() => setSelectedEffect(index)}
                    >
                      {item.char}
                    </button>
                  );
                })}
              </div>
              </div>

              <div className={styles.primaryCta}>
                <button
                  type="button"
                  className={`${styles.primaryCtaButton} ${canSubmit ? styles.primaryCtaButtonReady : ""} ${creating ? styles.primaryCtaButtonCreating : ""}`}
                  disabled={!canSubmit || creating}
                  onClick={handleCreate}
                >
                  {creating ? <><span className={styles.spinner} aria-hidden /> Creating Event…</> : "Create Event"}
                </button>
              </div>
            </div>
          </section>

          <aside className={styles.mediaColumn} aria-label="Event artwork">
            <button
              type="button"
              className={styles.hero}
              aria-label="Choose event cover"
              onClick={() => setPickerOpen(true)}
            >
              <img alt="" src={heroSrc} decoding="async" />
            </button>

            <div className={styles.thumbStrip}>
              {THUMBNAILS.map((thumb, index) => {
                const selected = selectedThumb === index;
                const common = `${styles.thumb} ${selected ? styles.thumbSelected : ""}`;

                if (thumb.kind === "placeholder") {
                  return (
                    <button
                      key={thumb.id}
                      type="button"
                      className={common}
                      aria-label="Upload your own cover image"
                      aria-pressed={selected}
                      onClick={() => setPickerOpen(true)}
                    >
                      <span className={styles.thumbPlaceholder}>
                        <span className={styles.imageStack}>
                          <img src={assets.iconImageStackSecondary} alt="" aria-hidden="true" className={styles.imageStackBack} />
                          <img src={assets.iconImageStackPrimary} alt="" aria-hidden="true" className={styles.imageStackFront} />
                        </span>
                      </span>
                    </button>
                  );
                }

                if (thumb.kind === "stack") {
                  return (
                    <button
                      key={thumb.id}
                      type="button"
                      className={common}
                      aria-pressed={selected}
                      aria-label={`Artwork option ${index + 1}`}
                      onClick={() => handleSelectThumb(index)}
                    >
                      <span
                        className={`${styles.thumbInner} ${styles.thumbStack} ${thumb.opacityClass ?? ""}`}
                      >
                        <img className={styles.stackLayerBack} src={thumb.back} alt="" decoding="async" />
                        <img className={styles.stackLayerFront} src={thumb.front} alt="" decoding="async" />
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={thumb.id}
                    type="button"
                    className={common}
                    aria-pressed={selected}
                    aria-label={`Artwork option ${index + 1}`}
                    onClick={() => handleSelectThumb(index)}
                  >
                    <span className={`${styles.thumbInner} ${thumb.opacityClass ?? ""}`}>
                      <img src={thumb.src} alt="" decoding="async" />
                      {thumb.fadeOverlay ? <span className={styles.thumbFade} aria-hidden /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </div>

      {toast ? <div className={styles.toast} role="status">{toast}</div> : null}

      {pickerOpen ? (
        <PhotoPickerPanel
          onSelect={(url, file) => {
            setPickerSelectedUrl(url);
            setPickerSelectedFile(file ?? null);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}

      {descModalOpen && (
        <Modal title="Description" onClose={() => setDescModalOpen(false)}>
          <textarea
            className={styles.descModalTextarea}
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            placeholder="What's this event about?"
            aria-label="Event description"
            autoFocus
          />
          <button
            type="button"
            className={styles.descModalSave}
            onClick={() => { setDescription(descDraft); setDescModalOpen(false); }}
          >
            Done
          </button>
        </Modal>
      )}
    </div>
  );
}

export default CreateEventScreen;
