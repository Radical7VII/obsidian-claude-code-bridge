import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SelectionListener } from "../src/selection";

describe("SelectionListener", () => {
  let listener: SelectionListener;
  let sendFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    sendFn = vi.fn();
    listener = new SelectionListener(sendFn, 50);
  });

  afterEach(() => {
    listener.destroy();
    vi.useRealTimers();
  });

  it("formats selection_changed params correctly", () => {
    listener.handleSelectionChange(
      "hello world",
      "/vault/note.md",
      { line: 2, ch: 5 },
      { line: 2, ch: 16 }
    );
    vi.advanceTimersByTime(50);

    expect(sendFn).toHaveBeenCalledWith("selection_changed", {
      text: "hello world",
      filePath: "/vault/note.md",
      fileUrl: "file:///vault/note.md",
      selection: {
        start: { line: 2, character: 5 },
        end: { line: 2, character: 16 },
        isEmpty: false,
      },
    });
  });

  it("sends isEmpty: true when no text selected", () => {
    listener.handleSelectionChange(
      "",
      "/vault/note.md",
      { line: 0, ch: 0 },
      { line: 0, ch: 0 }
    );
    vi.advanceTimersByTime(50);

    expect(sendFn).toHaveBeenCalledWith("selection_changed", {
      text: "",
      filePath: "/vault/note.md",
      fileUrl: "file:///vault/note.md",
      selection: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
        isEmpty: true,
      },
    });
  });

  it("debounces rapid selection changes", () => {
    listener.handleSelectionChange("a", "/vault/note.md", { line: 0, ch: 0 }, { line: 0, ch: 1 });
    vi.advanceTimersByTime(20);
    listener.handleSelectionChange("ab", "/vault/note.md", { line: 0, ch: 0 }, { line: 0, ch: 2 });
    vi.advanceTimersByTime(20);
    listener.handleSelectionChange("abc", "/vault/note.md", { line: 0, ch: 0 }, { line: 0, ch: 3 });
    vi.advanceTimersByTime(50);

    expect(sendFn).toHaveBeenCalledTimes(1);
    expect(sendFn).toHaveBeenCalledWith("selection_changed", expect.objectContaining({ text: "abc" }));
  });

  it("does not send duplicate notifications for same selection", () => {
    listener.handleSelectionChange("hello", "/vault/note.md", { line: 1, ch: 0 }, { line: 1, ch: 5 });
    vi.advanceTimersByTime(50);
    listener.handleSelectionChange("hello", "/vault/note.md", { line: 1, ch: 0 }, { line: 1, ch: 5 });
    vi.advanceTimersByTime(50);

    expect(sendFn).toHaveBeenCalledTimes(1);
  });
});
