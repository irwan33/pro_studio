import { emptyEditorScene } from "@/lib/editor/scene";
import { serializeEditorState } from "@/lib/editor/serialization";
import { createCircleElement, createRectElement, createTextElement } from "@/lib/editor/factory";
import { editorFontPresets } from "@/lib/editor/fonts";
import type { EditorElement, EditorScene } from "@/lib/editor/types";

export const templateCategories = ["Matchday", "Full Time", "Starting XI", "Player Signing", "Player Stats", "Quote", "Fixtures", "Lineup", "Goal", "Transfer News"];

export const socialFormats = [
  { label: "Instagram Portrait", width: 1080, height: 1350 },
  { label: "Instagram Square", width: 1080, height: 1080 },
  { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Twitter/X Post", width: 1600, height: 900 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
  { label: "Facebook Post", width: 1200, height: 630 }
];

export const typographyPresets = [
  { name: "Matchday title", size: 132, font: "Impact", color: "#737373" },
  { name: "Team name", size: 78, font: "Impact", color: "#ffffff" },
  { name: "Score", size: 180, font: "Impact", color: "#C7FF00" },
  { name: "Player name", size: 88, font: "Impact", color: "#ffffff" },
  { name: "Player number", size: 220, font: "Impact", color: "#C7FF00" },
  { name: "Match date", size: 26, font: "IBM Plex Mono", color: "#F5F5F2" },
  { name: "Stadium", size: 24, font: "IBM Plex Mono", color: "#B6B9B1" },
  { name: "Quote", size: 64, font: "Inter", color: "#ffffff" },
  { name: "Statistic label", size: 22, font: "IBM Plex Mono", color: "#C7FF00" },
  { name: "Breaking news", size: 96, font: "Impact", color: "#EF4444" },
  ...editorFontPresets
];

/**
 * Template scenes are authored directly in the editor element model. Ids are
 * pinned so a template always produces the same scene, and `serializeEditorState`
 * normalises z-index ordering.
 */
function templateScene(
  width: number,
  height: number,
  elements: EditorElement[],
  overrides: { background?: string; metadata?: Record<string, unknown> } = {}
): EditorScene {
  const base = emptyEditorScene(width, height);
  return serializeEditorState({
    version: base.version,
    width,
    height,
    background: overrides.background ?? base.background,
    elements: elements.map((element, index) => ({ ...element, zIndex: index })),
    metadata: { ...base.metadata, ...(overrides.metadata ?? {}) }
  });
}

/** Pins a generated element to a stable id so templates stay reproducible. */
function withId(element: EditorElement, id: string): EditorElement {
  return { ...element, id };
}

function text(id: string, init: Parameters<typeof createTextElement>[0]): EditorElement {
  return withId(createTextElement(init), id);
}

function rect(id: string, init: Parameters<typeof createRectElement>[0]): EditorElement {
  return withId(createRectElement(init), id);
}

function circle(id: string, init: Parameters<typeof createCircleElement>[0]): EditorElement {
  return withId(createCircleElement(init), id);
}

/** Polygons are line elements with `closed: true` and flat point pairs. */
function polygon(
  id: string,
  init: { name: string; x: number; y: number; points: number[]; fill: string; opacity?: number }
): EditorElement {
  const xs = init.points.filter((_, index) => index % 2 === 0);
  const ys = init.points.filter((_, index) => index % 2 === 1);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    id,
    type: "line",
    name: init.name,
    x: init.x + minX,
    y: init.y + minY,
    width: Math.max(1, Math.max(...xs) - minX),
    height: Math.max(1, Math.max(...ys) - minY),
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: init.opacity ?? 1,
    visible: true,
    locked: false,
    zIndex: 0,
    properties: {
      points: init.points.map((value, index) => (index % 2 === 0 ? value - minX : value - minY)),
      closed: true,
      fill: init.fill,
      strokeWidth: 0
    }
  };
}

const generatedTemplates = [
  { name: "Madrid vs Barca Matchday", category: "Matchday", width: 1080, height: 1350, accent: "#C7FF00" },
  { name: "Full Time Result", category: "Full Time", width: 1080, height: 1350, accent: "#22C55E" },
  { name: "Starting XI Board", category: "Starting XI", width: 1080, height: 1350, accent: "#38BDF8" },
  { name: "Player Signing Reveal", category: "Player Signing", width: 1080, height: 1920, accent: "#F59E0B" },
  { name: "Player Stats Poster", category: "Player Stats", width: 1080, height: 1350, accent: "#C7FF00" },
  { name: "Transfer News Thumbnail", category: "Transfer News", width: 1280, height: 720, accent: "#EF4444" }
].map((item, index) => ({
  ...item,
  slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  description: "Editable sports graphic template for " + item.category,
  sportType: "Football",
  isPremium: index > 3,
  isPublished: true,
  thumbnailUrl: "/seed/template-" + (index + 1) + ".svg",
  sceneJson: templateScene(item.width, item.height, [
    ...emptyEditorScene(item.width, item.height).elements,
    circle("accent-orbit", {
      name: "Light Effect",
      x: item.width - 280,
      y: 70,
      radius: 160,
      fill: item.accent,
      opacity: 0.18
    }),
    text("category-label", {
      name: "Category Label",
      text: item.category.toUpperCase(),
      x: 96,
      y: item.height - 180,
      width: 760,
      fontSize: 42,
      fill: item.accent,
      fontFamily: "IBM Plex Mono"
    })
  ])
}));

const LOGO_MARK = [0, 0, 34, 0, 7, 55, -27, 55];
const LOGO_S = [25, 0, 98, 0, 82, 28, 42, 28, 35, 40, 97, 40, 81, 68, 9, 68, 0, 54, 14, 30];
const RED_PANEL = [0, 0, 545, 0, 416, 244, 0, 244];

const umpanSilangQuoteScene = templateScene(
  1080,
  1350,
  [
    { ...rect("quote-bg", { name: "Black Background", x: 0, y: 0, width: 1080, height: 1350, fill: "#000000" }), locked: true },
    circle("logo-dot", { name: "Logo Dot", x: 50, y: 113, radius: 7, fill: "#ffffff" }),
    polygon("logo-mark-white-a", { name: "Logo Mark White A", x: 85, y: 40, points: LOGO_MARK, fill: "#ffffff" }),
    polygon("logo-mark-white-b", { name: "Logo Mark White B", x: 138, y: 40, points: LOGO_MARK, fill: "#ffffff" }),
    polygon("logo-s-red", { name: "Logo S Red", x: 89, y: 68, points: LOGO_S, fill: "#ff3434" }),
    text("brand-umpan", { name: "Brand Umpan", text: "UMPAN", x: 824, y: 59, width: 214, fontSize: 35, fill: "#ffffff", fontFamily: "Impact", fontStyle: "italic" }),
    circle("brand-dot", { name: "Brand Dot", x: 818, y: 111, radius: 5, fill: "#ffffff" }),
    text("brand-silang", { name: "Brand Silang", text: "SILANG", x: 838, y: 92, width: 218, fontSize: 37, fill: "#ff3434", fontFamily: "Impact", fontStyle: "italic" }),
    rect("white-separator", { name: "White Separator Line", x: 0, y: 626, width: 1080, height: 3, fill: "#ffffff", opacity: 0.88 }),
    rect("noise-band", { name: "Soft Noise Band", x: 0, y: 629, width: 1080, height: 112, fill: "rgba(255,255,255,0.06)", opacity: 0.35 }),
    polygon("quote-red-panel", { name: "Red Quote Panel", x: 0, y: 1010, points: RED_PANEL, fill: "#b02020", opacity: 0.92 }),
    text("quote-symbol", { name: "Quote Symbol", text: "\u201C", x: 73, y: 1048, width: 70, fontSize: 58, fill: "#ffffff", fontFamily: "Georgia", fontWeight: "700" }),
    text("quote-text", {
      name: "Quote Text",
      text: "Saat meninggalkan Liverpool saya merasa\nkehabisan tenaga. Sekarang saya sudah\nkembali segar dan siap bekerja lagi",
      x: 70,
      y: 1086,
      width: 760,
      fontSize: 40,
      lineHeight: 1.15,
      fill: "#ffffff",
      fontFamily: "Arial",
      fontStyle: "italic"
    }),
    circle("bottom-red-curve", { name: "Bottom Red Curve", x: -260, y: 1315, radius: 260, fill: "#bd2020", opacity: 0.95 })
  ],
  { background: "#000000", metadata: { grid: true, safeArea: true, template: "umpan-silang-quote" } }
);

export const seedTemplates = [
  ...generatedTemplates,
  {
    name: "Umpan Silang Quote Poster",
    category: "Quote",
    width: 1080,
    height: 1350,
    accent: "#ff3434",
    slug: "umpan-silang-quote-poster",
    description: "Editable black and red sports quote poster",
    sportType: "Football",
    isPremium: false,
    isPublished: true,
    thumbnailUrl: "/seed/template-quote-umpan-silang.png",
    sceneJson: umpanSilangQuoteScene
  }
];
