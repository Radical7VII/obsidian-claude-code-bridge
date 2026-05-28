export interface EditorPosition {
  line: number;
  ch: number;
}

export class SelectionListener {
  private sendFn: (method: string, params: unknown) => void;
  private debounceMs: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastKey: string = "";

  constructor(sendFn: (method: string, params: unknown) => void, debounceMs = 50) {
    this.sendFn = sendFn;
    this.debounceMs = debounceMs;
  }

  handleSelectionChange(
    text: string,
    filePath: string,
    from: EditorPosition,
    to: EditorPosition
  ): void {
    const key = `${filePath}:${from.line}:${from.ch}:${to.line}:${to.ch}:${text}`;
    if (key === this.lastKey) return;

    if (this.timer !== null) clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      this.lastKey = key;
      this.sendFn("selection_changed", {
        text,
        filePath,
        fileUrl: `file://${filePath}`,
        selection: {
          start: { line: from.line, character: from.ch },
          end: { line: to.line, character: to.ch },
          isEmpty: text === "",
        },
      });
      this.timer = null;
    }, this.debounceMs);
  }

  destroy(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
