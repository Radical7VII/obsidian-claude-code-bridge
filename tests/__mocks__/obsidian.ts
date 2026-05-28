export class Plugin {
  app: any = { vault: { adapter: { getBasePath: () => "/mock/vault" } } };
  registerEvent(_event: any) {}
  registerInterval(_id: number) { return _id; }
}

export class MarkdownView {
  editor = {
    getSelection: () => "",
    getCursor: (pos?: string) => ({ line: 0, ch: 0 }),
    getLine: (n: number) => "",
  };
  file = { path: "test.md" };
  getViewType() { return "markdown"; }
}

export class Notice {
  constructor(_msg: string) {}
}

export class PluginSettingTab {}
