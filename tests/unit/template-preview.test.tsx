// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AssetPanel } from "@/components/editor/AssetPanel";
import { useEditorStore } from "@/store/editorStore";

describe("template previews", () => {
  afterEach(cleanup);

  beforeEach(() => {
    useEditorStore.getState().setActivePanel("templates");
  });

  it("renders template preview images", () => {
    render(<AssetPanel />);
    const image = screen.getByAltText("Madrid vs Barca Matchday") as HTMLImageElement;
    expect(image).toBeTruthy();
    expect(image.src).toContain("/seed/template-1.svg");
  });

  it("renders template preview images for the quote template", () => {
    render(<AssetPanel />);
    const image = screen.getByAltText("Umpan Silang Quote Poster") as HTMLImageElement;
    expect(image).toBeTruthy();
    expect(image.src).toContain("/seed/template-quote-umpan-silang.png");
  });
});
