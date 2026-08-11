"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { EDITOR_UI_ATTRIBUTE } from "@/lib/editor/focus-mode";
import { emitStudioAction, setActionDragPayload, type StudioActionDetail } from "@/lib/editor/actions";
import { shapes as allShapes, shapeCategories } from "@/lib/editor/shapes";
import type { ShapeDefinition } from "@/lib/editor/shapes";

/**
 * Shapes panel for the editor sidebar.
 *
 * Layout: each category is a horizontal carousel of up to 10 shapes, with
 * previous / next arrow buttons when the row is scrollable, plus a final
 * "View all" end-card that opens the category detail grid.
 *
 * Detail view replaces the whole panel content (not a modal/popover) with a
 * back button, the category title and the full grid of supported shapes.
 *
 * Clicking a shape emits the existing `add-shape` studio action with the
 * SVG path so the shape factory recreates the Konva node on the artboard.
 */

/** Number of visible items before scroll arrows are shown. */
const ITEMS_PER_ROW = 10;

type SubView =
  | { kind: "categories" }
  | { kind: "detail"; category: string };

export function ShapesPanel() {
  const [view, setView] = useState<SubView>({ kind: "categories" });

  /** Categories derived from the data — "All" is never a row. */
  const carouselCategories = useMemo(
    () => shapeCategories.filter((category) => category !== "All"),
    []
  );

  if (view.kind === "detail") {
    return (
      <ShapesCategoryDetail
        category={view.category}
        onBack={() => setView({ kind: "categories" })}
      />
    );
  }

  return (
    <div className="mt-4 space-y-6" data-testid="shapes-panel">
      {carouselCategories.map((category) => (
        <ShapesCategoryRow
          key={category}
          category={category}
          onOpenDetail={() => setView({ kind: "detail", category })}
        />
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Category carousel row                                                  */
/* --------------------------------------------------------------------- */

function ShapesCategoryRow({
  category,
  onOpenDetail
}: {
  category: string;
  onOpenDetail: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const visible = useMemo(
    () => allShapes.filter((shape) => shape.category === category).slice(0, ITEMS_PER_ROW),
    [category]
  );

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > 4);
    // ceil avoids a 1 px rounding gap that would keep "next" enabled at the end.
    setCanScrollNext(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateArrows);
    };
  }, [updateArrows, visible.length]);

  /** Native smooth horizontal scroll by one card width (or a full page). */
  const scrollBy = useCallback((direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-shape-card]");
    const step = card ? card.offsetWidth + 12 : el.clientWidth;
    el.scrollBy({ left: direction * step * 2, behavior: "smooth" });
  }, []);

  return (
    <section
      aria-label={category}
      className="space-y-2"
      {...{ [EDITOR_UI_ATTRIBUTE]: "" }}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-studio-text">{category}</h3>
        <button
          type="button"
          onClick={onOpenDetail}
          className="font-mono text-[11px] font-semibold text-studio-accent transition hover:underline"
        >
          See all
        </button>
      </header>

      <div className="relative">
        {/* Prev / Next arrows — pointer-events stop propagation so a stray click
            never bubbles up and adds a shape accidentally. */}
        {canScrollPrev && (
          <RowNavButton
            direction="prev"
            disabled={!canScrollPrev}
            onClick={() => scrollBy(-1)}
          />
        )}
        {canScrollNext && (
          <RowNavButton
            direction="next"
            disabled={!canScrollNext}
            onClick={() => scrollBy(1)}
          />
        )}

        <div
          ref={scrollRef}
          data-testid={"shapes-row-" + category}
          className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {visible.map((shape) => (
            <ShapeCard key={shape.label} shape={shape} />
          ))}

          {/* End-of-list card — same action as "See all". */}
          <EndOfListCard category={category} onClick={onOpenDetail} />
        </div>
      </div>
    </section>
  );
}

function RowNavButton({
  direction,
  disabled,
  onClick
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      aria-label={isPrev ? "Scroll shapes left" : "Scroll shapes right"}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={
        "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-studio-border bg-studio-panel shadow-md transition hover:bg-studio-accentHover disabled:pointer-events-none disabled:opacity-0 " +
        (isPrev ? "-left-2" : "-right-2")
      }
    >
      {isPrev ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}

/* --------------------------------------------------------------------- */
/* Shape card                                                             */
/* --------------------------------------------------------------------- */

function ShapeCard({ shape }: { shape: ShapeDefinition }) {
  const detail: StudioActionDetail = {
    action: "add-shape",
    payload: { name: shape.label, svgPath: shape.path, viewBox: shape.viewBox }
  };

  return (
    <button
      type="button"
      draggable
      data-shape-card
      onDragStart={(event) => setActionDragPayload(event, detail)}
      onClick={() => emitStudioAction(detail)}
      aria-label={"Add " + shape.label}
      title={shape.label}
      className="group flex h-20 w-20 shrink-0 snap-start items-center justify-center rounded-2xl border border-studio-border bg-studio-elevated p-2.5 transition hover:border-studio-accent hover:bg-studio-accentHover"
    >
      <svg
        viewBox={shape.viewBox ?? "0 0 100 100"}
        className="h-10 w-10 text-studio-accent"
        fill="currentColor"
        aria-hidden
      >
        <path d={shape.path} />
      </svg>
    </button>
  );
}

function EndOfListCard({
  category,
  onClick
}: {
  category: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={"View all " + category + " shapes"}
      className="group flex h-20 w-20 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-studio-border bg-studio-elevated/50 text-studio-secondaryText transition hover:border-studio-accent hover:text-studio-text"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-studio-panel group-hover:bg-studio-accentHover">
        <ArrowRight size={16} />
      </span>
      <span className="font-mono text-[9px] font-semibold uppercase tracking-wider">
        All
      </span>
    </button>
  );
}

/* --------------------------------------------------------------------- */
/* Category detail grid                                                   */
/* --------------------------------------------------------------------- */

export function ShapesCategoryDetail({
  category,
  onBack
}: {
  category: string;
  onBack: () => void;
}) {
  const items = useMemo(
    () => allShapes.filter((shape) => shape.category === category),
    [category]
  );

  return (
    <div
      className="mt-4 flex min-h-0 flex-1 flex-col space-y-4"
      data-testid={"shapes-detail-" + category}
      {...{ [EDITOR_UI_ATTRIBUTE]: "" }}
    >
      <header className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={"Back to all shape categories"}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-studio-secondaryText transition hover:bg-studio-elevated hover:text-studio-text"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="text-sm font-semibold text-studio-text">{category}</h3>
      </header>

      <div
        data-testid="shapes-detail-grid"
        className="grid grid-cols-3 gap-3 overflow-y-auto pb-1 scrollbar-thin"
      >
        {items.map((shape) => {
          const detail: StudioActionDetail = {
            action: "add-shape",
            payload: { name: shape.label, svgPath: shape.path, viewBox: shape.viewBox }
          };
          return (
            <button
              key={shape.label}
              type="button"
              draggable
              onDragStart={(event) => setActionDragPayload(event, detail)}
              onClick={() => emitStudioAction(detail)}
              aria-label={"Add " + shape.label}
              className="group flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-studio-border bg-studio-elevated p-2 transition hover:border-studio-accent hover:bg-studio-accentHover"
            >
              <svg
                viewBox={shape.viewBox ?? "0 0 100 100"}
                className="h-9 w-9 text-studio-accent"
                fill="currentColor"
                aria-hidden
              >
                <path d={shape.path} />
              </svg>
              <span className="w-full truncate text-center font-mono text-[9px] text-studio-secondaryText group-hover:text-studio-text">
                {shape.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
