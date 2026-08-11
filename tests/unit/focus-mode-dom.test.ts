// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EDITOR_UI_ATTRIBUTE, isWorkspaceBackgroundTarget } from "@/lib/editor/focus-mode";

/**
 * DOM half of the focus-mode click rules.
 *
 * Focus mode hides every panel, so the only click that may trigger it is one on
 * the empty workspace around the artboard. These tests build the real shapes the
 * editor renders — panels, toolbars, modals, the Konva `canvas` — and assert that
 * none of them are mistaken for background.
 */

let workspace: HTMLElement;

/** Builds `<div data-workspace-background>` with the given inner markup. */
function mountWorkspace(inner = "") {
  document.body.innerHTML =
    '<div id="workspace" data-workspace-background data-name="workspace-background">' + inner + "</div>";
  return document.getElementById("workspace") as HTMLElement;
}

const q = (selector: string) => document.querySelector(selector) as HTMLElement;

beforeEach(() => {
  workspace = mountWorkspace();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("isWorkspaceBackgroundTarget", () => {
  it("accepts the workspace container itself", () => {
    expect(isWorkspaceBackgroundTarget(workspace, workspace)).toBe(true);
  });

  it("accepts a plain wrapper inside it that carries the marker", () => {
    workspace = mountWorkspace('<div data-workspace-background id="pad"></div>');
    expect(isWorkspaceBackgroundTarget(q("#pad"), workspace)).toBe(true);
  });

  it("rejects an inner wrapper without the marker", () => {
    // Unmarked wrappers are layout scaffolding, not the click surface.
    workspace = mountWorkspace('<div id="scroll"><div id="inner"></div></div>');
    expect(isWorkspaceBackgroundTarget(q("#scroll"), workspace)).toBe(false);
    expect(isWorkspaceBackgroundTarget(q("#inner"), workspace)).toBe(false);
  });

  it("rejects the Konva stage canvas, so artboard and element clicks never count", () => {
    workspace = mountWorkspace('<div data-workspace-background><canvas id="stage"></canvas></div>');
    expect(isWorkspaceBackgroundTarget(q("#stage"), workspace)).toBe(false);
  });

  it("rejects anything inside a subtree marked as editor UI", () => {
    workspace = mountWorkspace(
      "<div " +
        EDITOR_UI_ATTRIBUTE +
        ' id="chrome"><div data-workspace-background id="spoof"></div></div>'
    );
    expect(isWorkspaceBackgroundTarget(q("#chrome"), workspace)).toBe(false);
    // The marker attribute must not be able to override a chrome ancestor.
    expect(isWorkspaceBackgroundTarget(q("#spoof"), workspace)).toBe(false);
  });

  it("rejects interactive controls", () => {
    workspace = mountWorkspace(
      [
        '<button id="btn" data-workspace-background></button>',
        '<a id="link" href="#" data-workspace-background></a>',
        '<input id="field" data-workspace-background />',
        '<textarea id="area" data-workspace-background></textarea>',
        '<select id="pick" data-workspace-background></select>',
        '<label id="tag" data-workspace-background></label>'
      ].join("")
    );
    for (const id of ["#btn", "#link", "#field", "#area", "#pick", "#tag"]) {
      expect(isWorkspaceBackgroundTarget(q(id), workspace)).toBe(false);
    }
  });

  it("rejects panels, headers, toolbars, menus and modals", () => {
    workspace = mountWorkspace(
      [
        '<aside id="panel" data-workspace-background></aside>',
        '<header id="head" data-workspace-background></header>',
        '<div role="toolbar" id="bar" data-workspace-background></div>',
        '<div role="dialog" id="modal" data-workspace-background></div>',
        '<div role="menu" id="menu" data-workspace-background></div>',
        '<div role="listbox" id="list" data-workspace-background></div>',
        '<div role="tooltip" id="tip" data-workspace-background></div>'
      ].join("")
    );
    for (const id of ["#panel", "#head", "#bar", "#modal", "#menu", "#list", "#tip"]) {
      expect(isWorkspaceBackgroundTarget(q(id), workspace)).toBe(false);
    }
  });

  it("rejects a deeply nested child of chrome", () => {
    workspace = mountWorkspace(
      '<aside><div><span><i id="deep" data-workspace-background></i></span></div></aside>'
    );
    expect(isWorkspaceBackgroundTarget(q("#deep"), workspace)).toBe(false);
  });

  it("rejects targets outside the workspace", () => {
    // A marked element elsewhere on the page is still not this workspace.
    const outside = document.createElement("div");
    outside.setAttribute("data-workspace-background", "");
    document.body.appendChild(outside);
    expect(isWorkspaceBackgroundTarget(outside, workspace)).toBe(false);
  });

  it("rejects a missing container or a non-element target", () => {
    expect(isWorkspaceBackgroundTarget(workspace, null)).toBe(false);
    expect(isWorkspaceBackgroundTarget(null, workspace)).toBe(false);
    expect(isWorkspaceBackgroundTarget(document, workspace)).toBe(false);
    // SVG icons are not HTMLElements, so they can never pass either.
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("data-workspace-background", "");
    workspace.appendChild(svg);
    expect(isWorkspaceBackgroundTarget(svg, workspace)).toBe(false);
  });
});
