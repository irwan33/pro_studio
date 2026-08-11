// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProjectCard } from "@/components/dashboard/ProjectCard";

describe("ProjectCard thumbnail", () => {
  afterEach(cleanup);

  const base = {
    id: "project-1",
    title: "Matchday Poster",
    width: 1080,
    height: 1350,
    isFavorite: false,
    updatedAt: "2026-01-01"
  };

  it("shows a fallback placeholder when no thumbnail is provided", () => {
    render(<ProjectCard project={{ ...base, thumbnailUrl: null }} />);
    expect(screen.getByText("PRO")).toBeTruthy();
  });

  it("renders the thumbnail image when a URL is provided", () => {
    render(<ProjectCard project={{ ...base, thumbnailUrl: "/seed/template-1.svg" }} />);
    const image = screen.getByAltText("Matchday Poster") as HTMLImageElement;
    expect(image).toBeTruthy();
    expect(image.src).toContain("/seed/template-1.svg");
  });

  it("preserves the project aspect ratio via padding-bottom", () => {
    render(<ProjectCard project={{ ...base, thumbnailUrl: "/seed/template-1.svg", width: 1080, height: 720 }} />);
    const link = screen.getByRole("link") as HTMLAnchorElement;
    expect(link.style.paddingBottom).toMatch(/^66\.666/);
  });
});
