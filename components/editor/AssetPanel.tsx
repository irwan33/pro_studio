"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Circle, Frame, ImagePlus, MoreHorizontal, Pentagon, Search, Square, Type } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { seedTemplates, socialFormats } from "@/lib/editor/templates";
import { editorFontPresets, editorFontVariants, expandableEditorFonts } from "@/lib/editor/fonts";
import { useEditorStore } from "@/store/editorStore";
import { FilterPanel } from "@/components/editor/FilterPanel";
import { GradientPicker } from "@/components/editor/GradientPicker";
import { emitStudioAction, setActionDragPayload, type StudioActionDetail } from "@/lib/editor/actions";
import { ColorPanel } from "@/components/editor/ColorPanel";
import { PositionPanel } from "@/components/editor/position/PositionPanel";
import { ShapesPanel } from "@/components/editor/ShapesPanel";
import { EDITOR_UI_ATTRIBUTE } from "@/lib/editor/focus-mode";

type StudioAction = StudioActionDetail;

function dragPayload(event: React.DragEvent, detail: StudioAction) {
  setActionDragPayload(event, detail);
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-mono text-sm tracking-[0.18em] text-studio-secondaryText">{children}</h3>;
}

const localSportsImages = [
  { name: "Stadium Scarf Lights", src: "/assets/sports-images/stadium-scarf-lights.jpg", category: "Stadium" },
  { name: "Stadium Crowd Flags", src: "/assets/sports-images/stadium-crowd-flags.jpg", category: "Stadium" },
  { name: "Aerial Football Pitch", src: "/assets/sports-images/aerial-football-pitch.jpg", category: "Pitch" },
  { name: "Blue Seat Stadium", src: "/assets/sports-images/blue-seat-stadium.jpg", category: "Stadium" },
  { name: "Open Stadium Field", src: "/assets/sports-images/open-stadium-field.jpg", category: "Field" }
];

export function AssetPanel() {
  const active = useEditorStore((s) => s.activePanel);
  // The position panel manages its own single scroll region (sticky header +
  // tabs, scrolling body). If the outer panel also scrolled we would end up
  // with two nested scrollbars, so the outer scroll is disabled for it.
  const panelOwnsScroll = active === "position";
  return (
    <aside
      {...{ [EDITOR_UI_ATTRIBUTE]: "" }}
      className={
        // 96 px nav rail + 12 px gap, anchored below the EditorHeader (76 px)
        // and the floating contextual toolbar row (56 px incl. padding): 76 + 12 + 40 + 12 = 140 px.
        "fixed left-[calc(84px+12px)] top-[140px] z-30 h-[calc(100vh-140px-12px)] w-[320px] max-w-[calc(100vw-108px)] overflow-hidden rounded-[28px] border border-studio-border bg-studio-panel p-5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] " +
        (panelOwnsScroll ? "flex flex-col" : "overflow-y-auto scrollbar-thin")
      }
      data-asset-panel=""
    >
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-3 text-studio-secondaryText" size={18} />
        <Input className="pl-9" placeholder={"Search " + active + "..."} />
      </div>
      {active === "document" && <DocumentPanel />}
      {active === "templates" && <TemplatePanel />}
      {active === "elements" && <ElementsPanel />}
      {active === "uploads" && <UploadsPanel />}
      {active === "images" && <ImagesPanel />}
      {active === "text" && <TextPanel />}
      {active === "shapes" && <ShapesPanel />}
      {active === "color" && <ColorPanel />}
      {active === "position" && <PositionPanel />}
      {active === "gradients" && <GradientPicker />}
      {active === "filters" && <FilterPanel />}
    </aside>
  );
}

function DocumentPanel() {
  const width = useEditorStore((s) => s.width);
  const height = useEditorStore((s) => s.height);
  const background = useEditorStore((s) => s.background);
  return (
    <div className="mt-6 space-y-6">
      <section className="space-y-3">
        <PanelTitle>DOCUMENT SIZE</PanelTitle>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={width}
            onChange={(event) => emitStudioAction({ action: "document", payload: { width: Number(event.target.value), height } })}
          />
          <Input
            type="number"
            value={height}
            onChange={(event) => emitStudioAction({ action: "document", payload: { width, height: Number(event.target.value) } })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {socialFormats.map((format) => (
            <button key={format.label} onClick={() => emitStudioAction({ action: "document", payload: { width: format.width, height: format.height } })} className="rounded-2xl border border-studio-border bg-studio-elevated p-3 text-left hover:bg-studio-accentHover">
              <span className="block text-sm font-semibold">{format.label}</span>
              <span className="font-mono text-[10px] text-studio-muted">{format.width} x {format.height}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <PanelTitle>BACKGROUND</PanelTitle>
        <div className="grid grid-cols-6 gap-2">
          {["#090a09", "#111827", "#172554", "#4c0519", "#f8fafc", "#C7FF00"].map((color) => (
            <button key={color} aria-label={color} onClick={() => emitStudioAction({ action: "document", payload: { background: color } })} className="h-9 rounded-xl border border-studio-border" style={{ background: color }} />
          ))}
        </div>
        <Input value={background} onChange={(event) => emitStudioAction({ action: "document", payload: { background: event.target.value } })} />
        <Button className="w-full justify-start" onClick={() => emitStudioAction({ action: "add-page" })}><Frame size={16} />Add page</Button>
      </section>
    </div>
  );
}

function TemplatePanel() {
  return (
    <div className="mt-6 space-y-5">
      <PanelTitle>SPORTS TEMPLATES</PanelTitle>
      <div className="grid grid-cols-2 gap-3">
        {seedTemplates.map((template) => (
          <TemplateCard key={template.slug} template={template} />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: (typeof seedTemplates)[number] }) {
  const [status, setStatus] = useState<"loading" | "error" | "ready">(template.thumbnailUrl ? "loading" : "error");
  const aspectPadding = template.height > 0 ? (template.height / template.width) * 100 : 125;

  return (
    <button
      draggable
      onDragStart={(event) => dragPayload(event, { action: "apply-template", payload: template.sceneJson })}
      onClick={() => emitStudioAction({ action: "apply-template", payload: template.sceneJson })}
      className="relative block w-full overflow-hidden rounded-3xl border border-studio-border bg-studio-elevated text-left shadow-sm hover:bg-studio-accentHover"
      style={{ paddingBottom: aspectPadding + "%" }}
    >
      {template.thumbnailUrl ? (
        <>
          {status === "loading" && (
            <div className="absolute inset-0 animate-pulse bg-studio-elevated" aria-label="Loading template preview" />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={template.thumbnailUrl}
            alt={template.name}
            className={
              "absolute inset-0 h-full w-full object-cover " +
              (status === "ready" ? "opacity-100" : "opacity-0")
            }
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
          />
        </>
      ) : null}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-start justify-end p-3">
          <span className="font-display text-xl text-studio-accent">{template.category}</span>
          <p className="mt-2 text-xs">{template.name}</p>
          <p className="mt-1 font-mono text-[10px] text-studio-muted">{template.width} x {template.height}</p>
        </div>
      )}
      {status === "ready" && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <span className="font-display text-xl text-white">{template.category}</span>
          <p className="mt-1 text-xs text-white/90">{template.name}</p>
          <p className="mt-1 font-mono text-[10px] text-white/70">{template.width} x {template.height}</p>
        </div>
      )}
    </button>
  );
}

function ElementsPanel() {
  const [category, setCategory] = useState("All");
  const pendingReplaceId = useEditorStore((s) => s.pendingReplaceId);
  const categories = ["All", "Sports", "Images", "Shapes", "Frames", "Lines", "Overlays", "Badges"];
  const items: Array<{ label: string; category: string; detail: StudioAction; preview: React.ReactNode }> = [
    ...localSportsImages.map((image) => ({
      label: image.name,
      category: "Images",
      preview: <ImageAssetPreview src={image.src} name={image.name} />,
      // While Replace is armed these tiles complete the swap instead of adding.
      detail: (pendingReplaceId
        ? { action: "replace-image-source", payload: { elementId: pendingReplaceId, src: image.src, name: image.name } }
        : { action: "add-image", payload: { src: image.src, name: image.name } }) as StudioAction
    })),
    { label: "Player Cutout", category: "Sports", preview: <PlayerPreview />, detail: { action: "add-asset", payload: { kind: "player", name: "Player Cutout" } } },
    { label: "Score Card", category: "Sports", preview: <ScorePreview />, detail: { action: "add-element", payload: { kind: "score-card", name: "Score Card" } } },
    { label: "Match Info", category: "Sports", preview: <MatchInfoPreview />, detail: { action: "add-element", payload: { kind: "match-info", name: "Match Info Block" } } },
    { label: "Fixture Strip", category: "Sports", preview: <FixturePreview />, detail: { action: "add-element", payload: { kind: "fixture", name: "Fixture Strip" } } },
    { label: "Versus Lockup", category: "Sports", preview: <VersusPreview />, detail: { action: "add-element", payload: { kind: "versus", name: "Versus Lockup" } } },
    { label: "Stat Card", category: "Sports", preview: <StatPreview />, detail: { action: "add-element", payload: { kind: "stat-card", name: "Statistic Card" } } },
    { label: "Club Badge", category: "Badges", preview: <BadgePreview />, detail: { action: "add-element", payload: { kind: "badge", name: "Club Badge" } } },
    { label: "Sponsor Pill", category: "Badges", preview: <SponsorPreview />, detail: { action: "add-element", payload: { kind: "sponsor", name: "Sponsor Pill" } } },
    { label: "Lower Third", category: "Frames", preview: <LowerThirdPreview />, detail: { action: "add-element", payload: { kind: "lower-third", name: "Lower Third" } } },
    { label: "Image Frame", category: "Frames", preview: <FramePreview />, detail: { action: "add-shape", payload: { shape: "frame", name: "Image Frame" } } },
    { label: "Rectangle", category: "Shapes", preview: <ShapePreview shape="rect" />, detail: { action: "add-shape", payload: { shape: "rect", name: "Rectangle" } } },
    { label: "Circle", category: "Shapes", preview: <ShapePreview shape="circle" />, detail: { action: "add-shape", payload: { shape: "circle", name: "Circle" } } },
    { label: "Polygon", category: "Shapes", preview: <ShapePreview shape="polygon" />, detail: { action: "add-shape", payload: { shape: "polygon", name: "Polygon" } } },
    { label: "Arrow", category: "Lines", preview: <ArrowPreview />, detail: { action: "add-shape", payload: { shape: "arrow", name: "Arrow" } } },
    { label: "Divider", category: "Lines", preview: <DividerPreview />, detail: { action: "add-element", payload: { kind: "divider", name: "Divider Line" } } },
    { label: "Label Tag", category: "Badges", preview: <LabelPreview />, detail: { action: "add-element", payload: { kind: "label", name: "Label Tag" } } },
    { label: "Gradient Wash", category: "Overlays", preview: <GradientPreview />, detail: { action: "add-element", payload: { kind: "gradient", name: "Gradient Wash" } } },
    { label: "Diagonal Pattern", category: "Overlays", preview: <PatternPreview />, detail: { action: "add-element", payload: { kind: "pattern", name: "Diagonal Pattern" } } },
    { label: "Corner Accent", category: "Overlays", preview: <CornerPreview />, detail: { action: "add-element", payload: { kind: "corner", name: "Corner Accent" } } },
    { label: "Light Effect", category: "Overlays", preview: <LightPreview />, detail: { action: "add-asset", payload: { kind: "light", name: "Light Effect" } } }
  ];
  // `items` is rebuilt every render, so the memo is keyed on the inputs that
  // actually change what it produces.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visibleItems = useMemo(() => category === "All" ? items : items.filter((item) => item.category === category), [category, pendingReplaceId]);
  return (
    <div className="mt-5 space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={"shrink-0 rounded-2xl border px-3 py-2 font-mono text-xs font-semibold " + (category === item ? "border-studio-accent bg-studio-accent text-white" : "border-studio-border bg-studio-elevated text-studio-secondaryText hover:bg-studio-accentHover hover:text-studio-text")}
          >
            {item}
          </button>
        ))}
      </div>
      <section>
        <PanelTitle>{category === "All" ? "ELEMENT LIBRARY" : category.toUpperCase()}</PanelTitle>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {visibleItems.map((item) => <ElementLibraryCard key={item.label} label={item.label} detail={item.detail}>{item.preview}</ElementLibraryCard>)}
        </div>
      </section>
    </div>
  );
}

function ElementLibraryCard({ label, detail, children }: { label: string; detail: StudioAction; children: React.ReactNode }) {
  return (
    <button
      draggable
      onDragStart={(event) => dragPayload(event, detail)}
      onClick={() => emitStudioAction(detail)}
      className="group overflow-hidden rounded-3xl border border-studio-border bg-studio-elevated text-left shadow-sm transition hover:bg-studio-accentHover"
    >
      <span className="flex h-28 items-center justify-center bg-white p-3">{children}</span>
      <span className="block truncate border-t border-studio-border px-3 py-2 font-mono text-xs font-semibold text-studio-secondaryText group-hover:text-studio-text">{label}</span>
    </button>
  );
}

function ImageAssetPreview({ src, name }: { src: string; name: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className="h-full w-full rounded-2xl object-cover" />
  );
}

function PlayerPreview() {
  return <div className="relative h-20 w-14 rounded-t-full border-2 border-studio-accent bg-[#7f918b] before:absolute before:-top-7 before:left-3 before:h-8 before:w-8 before:rounded-full before:bg-[#d2a48b]" />;
}

function ScorePreview() {
  return <div className="w-full rounded-2xl border border-studio-border bg-white px-2 py-3 text-center font-display text-xl text-studio-text shadow-inner">2 - 1</div>;
}

function MatchInfoPreview() {
  return <div className="w-full rounded-2xl border border-studio-border bg-studio-elevated px-2 py-2 text-center font-mono text-[10px] text-studio-text">OCT 24 / 20:00</div>;
}

function FixturePreview() {
  return <div className="flex w-full items-center justify-between rounded-2xl bg-studio-accent px-3 py-2 font-display text-sm text-white"><span>MAD</span><span>VS</span><span>BAR</span></div>;
}

function VersusPreview() {
  return <div className="text-center font-display text-4xl text-studio-accent">VS</div>;
}

function StatPreview() {
  return <div className="rounded-2xl border border-studio-border bg-white px-4 py-2 text-center shadow-inner"><div className="font-display text-3xl text-studio-accent">87</div><div className="font-mono text-[10px] text-studio-secondaryText">PACE</div></div>;
}

function BadgePreview() {
  return <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-studio-accent bg-white font-display text-xl text-studio-text shadow-inner">FC</div>;
}

function SponsorPreview() {
  return <div className="rounded-full border border-studio-accent px-5 py-2 font-mono text-[10px] text-studio-text">SPONSOR</div>;
}

function LowerThirdPreview() {
  return <div className="w-full rounded-2xl border-l-4 border-studio-accent bg-studio-elevated p-2 shadow-inner"><div className="h-3 w-20 rounded bg-studio-text" /><div className="mt-2 h-2 w-28 rounded bg-studio-muted" /></div>;
}

function FramePreview() {
  return <div className="h-16 w-24 border-4 border-studio-accent bg-studio-accent/10" />;
}

function ShapePreview({ shape }: { shape: "rect" | "circle" | "polygon" }) {
  if (shape === "circle") return <Circle size={56} className="text-studio-accent" />;
  if (shape === "polygon") return <Pentagon size={58} className="text-studio-accent" />;
  return <Square size={58} className="text-studio-accent" />;
}

function ArrowPreview() {
  return <div className="relative h-4 w-24 bg-studio-accent after:absolute after:-right-1 after:-top-3 after:border-y-[14px] after:border-l-[22px] after:border-y-transparent after:border-l-studio-accent" />;
}

function DividerPreview() {
  return <div className="h-1 w-28 bg-studio-accent shadow-[0_10px_0_rgba(245,245,242,0.55)]" />;
}

function LabelPreview() {
  return <div className="rounded-2xl bg-studio-accent px-4 py-2 font-display text-sm text-white">LIVE</div>;
}

function GradientPreview() {
  return <div className="h-20 w-full rounded-3xl bg-[radial-gradient(circle_at_top,#e5b39f,transparent_55%),linear-gradient(135deg,#d7e4e6,#f7f1ea)]" />;
}

function PatternPreview() {
  return <div className="h-20 w-full rounded-3xl bg-[repeating-linear-gradient(135deg,rgba(17,17,17,.18)_0_8px,rgba(255,255,255,.75)_8px_16px)]" />;
}

function CornerPreview() {
  return <div className="relative h-20 w-full border border-studio-border before:absolute before:left-0 before:top-0 before:h-12 before:w-12 before:border-l-4 before:border-t-4 before:border-studio-accent after:absolute after:bottom-0 after:right-0 after:h-12 after:w-12 after:border-b-4 after:border-r-4 after:border-studio-accent" />;
}

function LightPreview() {
  return <div className="h-20 w-full rounded-3xl bg-[radial-gradient(circle,#f4b7a388,transparent_60%)]" />;
}

function UploadsPanel() {
  const pendingReplaceId = useEditorStore((s) => s.pendingReplaceId);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      // While the Replace flow is armed, an upload swaps the source of the
      // existing element instead of inserting a new one.
      if (pendingReplaceId) {
        emitStudioAction({
          action: "replace-image-source",
          payload: { elementId: pendingReplaceId, src: reader.result, name: file.name }
        });
        return;
      }
      emitStudioAction({ action: "add-image", payload: { src: reader.result, name: file.name } });
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <div className="mt-6 space-y-4">
      {pendingReplaceId && <ReplaceNotice />}
      <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-studio-border bg-studio-elevated text-center hover:bg-studio-accentHover">
        <ImagePlus size={24} />
        <span className="mt-2 font-semibold">{pendingReplaceId ? "Upload a replacement" : "Upload image or SVG"}</span>
        <span className="text-xs text-studio-muted">PNG, JPG, WebP, SVG</span>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={upload} />
      </label>
      <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-studio-border bg-studio-elevated text-center opacity-80">
        <span className="font-semibold">Video upload placeholder</span>
        <span className="text-xs text-studio-muted">MP4 storage hook ready for later</span>
        <input type="file" accept="video/mp4,video/webm" className="hidden" />
      </label>
    </div>
  );
}

/** Banner shown while an image element is waiting for a replacement source. */
function ReplaceNotice() {
  const setPendingReplaceId = useEditorStore((s) => s.setPendingReplaceId);
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-studio-accent bg-studio-elevated px-4 py-3">
      <span className="text-xs font-semibold text-studio-text">
        Replacing an image — pick a new source
      </span>
      <button
        type="button"
        onClick={() => setPendingReplaceId(null)}
        className="rounded-xl px-2 py-1 text-xs font-semibold text-studio-muted transition hover:bg-studio-accentHover hover:text-studio-text"
      >
        Cancel
      </button>
    </div>
  );
}

function ImagesPanel() {
  const pendingReplaceId = useEditorStore((s) => s.pendingReplaceId);
  // Image assets only. Templates live exclusively in the dedicated Templates
  // menu; do not add design-template content here.
  const images = [
    ...localSportsImages,
    { name: "Reference Matchday Poster", src: "/reference/matchday-poster-reference.jpeg", category: "Posters" }
  ];

  // The same grid serves both flows: inserting a new image, and completing a
  // Replace by swapping the source of the armed element.
  function detailFor(image: { src: string; name: string }): StudioAction {
    return pendingReplaceId
      ? { action: "replace-image-source", payload: { elementId: pendingReplaceId, src: image.src, name: image.name } }
      : { action: "add-image", payload: { src: image.src, name: image.name } };
  }

  return (
    <div className="mt-6 space-y-5">
      {pendingReplaceId && <ReplaceNotice />}
      <PanelTitle>LOCAL IMAGE LIBRARY</PanelTitle>
      <div className="grid grid-cols-2 gap-3">
        {images.map((image) => (
          <button key={image.src} draggable onDragStart={(event) => dragPayload(event, detailFor(image))} onClick={() => emitStudioAction(detailFor(image))} className="overflow-hidden rounded-3xl border border-studio-border bg-studio-elevated text-left shadow-sm transition hover:bg-studio-accentHover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.src} alt="" className="h-28 w-full object-cover" />
            <span className="block p-2 font-mono text-[10px] text-studio-muted">{image.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TextPanel() {
  const elements = useEditorStore((s) => s.elements);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const [expandedFont, setExpandedFont] = useState<string | null>("Courier Prime");
  const [appliedFont, setAppliedFont] = useState<string | null>(null);
  const expandableFonts = new Set(expandableEditorFonts);
  const selectedText = elements.find((element) => selectedIds.includes(element.id) && element.type === "text");
  const selectedFontFamily = selectedText?.properties.fontFamily;
  const activeFont = appliedFont ?? (typeof selectedFontFamily === "string" ? selectedFontFamily : "Barlow Condensed");
  const defaultTextStyles = [
    { label: "Add a heading", text: "Add a heading", fontSize: 72, fontFamily: "Inter", fontWeight: "700", fill: "#151515", name: "Heading Text", className: "text-[36px] font-bold leading-none" },
    { label: "Add a subheading", text: "Add a subheading", fontSize: 44, fontFamily: "Inter", fontWeight: "700", fill: "#151515", name: "Subheading Text", className: "text-[24px] font-bold leading-none" },
    { label: "Add a little bit of body text", text: "Add a little bit of body text", fontSize: 28, fontFamily: "Inter", fontWeight: "400", fill: "#151515", name: "Body Text", className: "text-[18px] font-normal leading-none" }
  ];

  // A stable key for the current selection, so the applied-font highlight resets
  // when the selection changes rather than on every render.
  const selectionKey = selectedIds.join("|");

  useEffect(() => {
    setAppliedFont(null);
  }, [selectionKey]);

  function applyFont(preset: (typeof editorFontPresets)[number], variant?: (typeof editorFontVariants)[number]) {
    const fontWeight = variant?.fontWeight ?? "400";
    const fontStyle = variant?.fontStyle ?? "normal";
    if (selectedIds.length > 0) {
      setAppliedFont(preset.font);
      emitStudioAction({
        action: "update-active",
        payload: { properties: { fontFamily: preset.font, fontWeight, fontStyle } }
      });
      return;
    }
    emitStudioAction({
      action: "add-text",
      payload: { text: preset.name, fontSize: preset.size, fontFamily: preset.font, fill: preset.color, name: preset.name, fontWeight, fontStyle }
    });
  }

  return (
    <div className="mt-6">
      {selectedIds.length === 0 && (
        <section className="space-y-6">
          <button
            type="button"
            onClick={() => emitStudioAction({ action: "add-text", payload: { text: "Add a text box", fontSize: 42, fontFamily: "Inter", fill: "#151515", name: "Text Box", fontWeight: "400", fontStyle: "normal" } })}
            className="flex h-16 w-full items-center justify-center gap-5 rounded-2xl bg-[#8b3dff] text-xl font-bold text-white shadow-sm transition hover:bg-[#7d2ff0]"
          >
            <Type size={32} strokeWidth={1.8} />
            Add a text box
          </button>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-studio-text">Default text styles</h3>
            <div className="space-y-3">
              {defaultTextStyles.map((style) => (
                <button
                  key={style.name}
                  draggable
                  onDragStart={(event) => dragPayload(event, { action: "add-text", payload: { text: style.text, fontSize: style.fontSize, fontFamily: style.fontFamily, fill: style.fill, name: style.name, fontWeight: style.fontWeight, fontStyle: "normal" } })}
                  onClick={() => emitStudioAction({ action: "add-text", payload: { text: style.text, fontSize: style.fontSize, fontFamily: style.fontFamily, fill: style.fill, name: style.name, fontWeight: style.fontWeight, fontStyle: "normal" } })}
                  className="flex min-h-[76px] w-full items-center rounded-3xl border border-[#d7d9df] bg-white px-7 text-left text-studio-text transition hover:bg-[#f6f6f8]"
                >
                  <span className={style.className}>{style.label}</span>
                </button>
              ))}
            </div>
          </section>
        </section>
      )}

      {selectedIds.length > 0 && (
        <section className="space-y-2">
          <PanelTitle>FONT LIBRARY</PanelTitle>
          <div className="space-y-1">
            {editorFontPresets.map((preset) => {
              const active = preset.name === activeFont;
              const expandable = expandableFonts.has(preset.name);
              const expanded = expandedFont === preset.name;
              return (
                <div key={preset.name}>
                  <button
                    draggable
                    onDragStart={(event) => dragPayload(event, { action: "add-text", payload: { text: preset.name, fontSize: preset.size, fontFamily: preset.font, fill: preset.color, name: preset.name, fontWeight: "400", fontStyle: "normal" } })}
                    onClick={() => {
                      if (expandable) {
                        setExpandedFont((current) => current === preset.name ? null : preset.name);
                      }
                      applyFont(preset);
                    }}
                    className={
                      "group grid min-h-[42px] w-full grid-cols-[34px_minmax(0,1fr)_40px] items-center rounded-2xl px-2 text-left transition " +
                      (active ? "bg-[#f1f2f2] shadow-sm" : "hover:bg-studio-elevated")
                    }
                  >
                    <span className="flex items-center justify-center text-studio-text">
                      {expandable ? <ChevronRight size={19} strokeWidth={3} className={expanded ? "rotate-90 transition" : "transition"} /> : null}
                    </span>
                    <span className={"truncate text-[20px] leading-none text-studio-text " + (active ? "font-semibold" : "")} style={{ fontFamily: preset.font }}>
                      {preset.name}
                    </span>
                    <span className="flex justify-end">
                      {active ? (
                        <span className="flex h-8 w-9 items-center justify-center rounded-xl bg-[#e5e7e9] text-studio-text">
                          <MoreHorizontal size={18} strokeWidth={3} />
                        </span>
                      ) : null}
                    </span>
                  </button>
                  {expanded && (
                    <div className="pb-1 pl-[56px]">
                      {editorFontVariants.map((variant) => (
                        <button
                          key={variant.label}
                          draggable
                          onDragStart={(event) => dragPayload(event, { action: "add-text", payload: { text: variant.label, fontSize: preset.size, fontFamily: preset.font, fill: preset.color, name: preset.name + " " + variant.label, fontWeight: variant.fontWeight, fontStyle: variant.fontStyle } })}
                          onClick={() => applyFont(preset, variant)}
                          className="block min-h-[34px] w-full text-left text-[20px] leading-none text-studio-text"
                          style={{ fontFamily: preset.font, fontWeight: variant.fontWeight, fontStyle: variant.fontStyle }}
                        >
                          {variant.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}


