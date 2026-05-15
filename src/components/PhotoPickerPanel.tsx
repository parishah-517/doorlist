import { useState, useMemo, useRef, useEffect } from "react";
import { assets } from "../figmaAssets";
import styles from "./PhotoPickerPanel.module.css";

const EMPTY_ILLUSTRATION = "https://www.figma.com/api/mcp/asset/81f91372-9d7a-4982-b52d-aa84a0a52199";

function ChevronLeft() {
  return (
    <svg width="13" height="22" viewBox="0 0 13 22" fill="none" aria-hidden="true">
      <path d="M11 2L2 11L11 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type TabDef = {
  id: string;
  label: string;
  iconSrc: string;
  iconW: number;
  iconH: number;
  seedBase: number;
};

const TABS: TabDef[] = [
  { id: "featured",   label: "Featured",   iconSrc: assets.iconTabFeatured,  iconW: 14, iconH: 17, seedBase: 10  },
  { id: "gifs",       label: "GIFs",       iconSrc: assets.iconTabGifs,      iconW: 17, iconH: 12, seedBase: 40  },
  { id: "party",      label: "Party",      iconSrc: assets.iconTabParty,     iconW: 20, iconH: 20, seedBase: 70  },
  { id: "meme",       label: "Meme",       iconSrc: assets.iconTabMeme,      iconW: 20, iconH: 16, seedBase: 100 },
  { id: "greek-life", label: "Greek Life", iconSrc: assets.iconTabGreekLife, iconW: 20, iconH: 16, seedBase: 130 },
  { id: "sports",     label: "Sports",     iconSrc: assets.iconTabSports,    iconW: 16, iconH: 16, seedBase: 190 },
];

const GIPHY_IDS = [
  "3o7btNhMBytxAM6YBa",
  "26ufdipQqU84dAnmA",
  "l0MYt5jPR6QX5pnqM",
  "xT0Gqn9yONlIvHMcEE",
  "3oKIPnAiaMCws8nOsE",
  "JIX9t2j0ZTN9S",
  "5GoVLqeAOo6PK",
  "3ohzdRoOp1FUYbtGDu",
  "26BRL4bCxqp8CQj5m",
  "l3vR85wkETL0nNMmo",
  "du5kqtBmouGku",
  "xT9IgzoXnzbpZTU05L",
];

const PHOTOS_PER_TAB = 24;

function getTabPhotos(tab: TabDef): string[] {
  if (tab.id === "gifs") {
    return Array.from(
      { length: PHOTOS_PER_TAB },
      (_, i) => `https://media.giphy.com/media/${GIPHY_IDS[i % GIPHY_IDS.length]!}/giphy.gif`,
    );
  }
  return Array.from(
    { length: PHOTOS_PER_TAB },
    (_, i) => `https://picsum.photos/seed/${tab.seedBase + i}/300/300`,
  );
}

export type PhotoPickerPanelProps = {
  onSelect: (url: string, file?: File) => void;
  onClose: () => void;
};

export function PhotoPickerPanel({ onSelect, onClose }: PhotoPickerPanelProps) {
  const [activeTabId, setActiveTabId] = useState(TABS[0]!.id);
  const [query, setQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onSelect(URL.createObjectURL(file), file);
    e.target.value = "";
  };

  const activeTab = TABS.find((t) => t.id === activeTabId) ?? TABS[0]!;
  const photos = useMemo(() => getTabPhotos(activeTab), [activeTab]);

  useEffect(() => {
    TABS.forEach((tab) => {
      getTabPhotos(tab).forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    });
  }, []);
  const hasQuery = query.trim().length > 0;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.panel} role="dialog" aria-label="Choose event cover photo" aria-modal="true">
      {/* Nav bar */}
      <div className={styles.navBar}>
        <button type="button" className={styles.navBack} onClick={onClose} aria-label="Close">
          <ChevronLeft />
        </button>
        <span className={styles.navTitle}>Event Cover</span>
        <span style={{ width: 50 }} aria-hidden="true" />
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <div className={styles.searchField}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.searchIcon}>
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Find an image"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search images"
          />
          {query && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="8" fill="rgba(60,60,67,0.35)" />
                <path d="M5 5L11 11M11 5L5 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBarWrap}>
      <div className={styles.tabBar} role="tablist" aria-label="Image categories">
        {TABS.map((tab) => {
          const active = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.tab} ${active ? styles.tabActive : ""}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className={styles.tabContent}>
                <span className={styles.tabIconWrap}>
                  <img
                    src={tab.iconSrc}
                    width={tab.iconW}
                    height={tab.iconH}
                    alt=""
                    aria-hidden="true"
                    style={{ display: "block", opacity: active ? 1 : 0.3 }}
                  />
                </span>
                <span className={`${styles.tabLabel} ${active ? styles.tabLabelActive : ""}`}>
                  {tab.label}
                </span>
              </span>
              <span className={`${styles.tabIndicator} ${active ? styles.tabIndicatorActive : ""}`} />
            </button>
          );
        })}
      </div>
      </div>

      {/* Content area */}
      {hasQuery ? (
        <div className={styles.emptyState}>
          <img
            src={EMPTY_ILLUSTRATION}
            alt=""
            width={132}
            height={159}
            decoding="async"
            className={styles.emptyIllustration}
          />
          <div className={styles.emptyText}>
            <p className={styles.emptyTitle}>Try something else!</p>
            <p className={styles.emptyBody}>
              {"Couldn't find what you were looking for.\nTry creating it with AI"}
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.scrollArea} role="tabpanel">
          <div className={styles.photoGrid}>
            {photos.map((url, i) => (
              <button
                key={`${activeTabId}-${i}`}
                type="button"
                className={styles.photoCell}
                aria-label={`Select photo ${i + 1}`}
                onClick={() => onSelect(url)}
              >
                <img className={styles.photoImg} src={url} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Sticky upload footer */}
      <div className={styles.uploadFooter}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button type="button" className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 11V1M8 1L4 5M8 1L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1 12V14C1 14.5523 1.44772 15 2 15H14C14.5523 15 15 14.5523 15 14V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Upload image
        </button>
      </div>
    </div>
    </>
  );
}
