# Obsidian Claude Code Bridge

一个 Obsidian 插件，将当前打开的笔记和选中的文字实时传递给 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI。

在 Obsidian 中打开笔记或选中文字后，旁边终端里的 Claude Code 会自动将该文件作为上下文 — 体验与 VS Code 一致。

### 使用方法

1. 在 Obsidian 中启用插件
2. 打开一个终端，**切换到你的 vault 目录**
3. 运行 `claude`
4. 运行 `/ide` 连接到 Obsidian
5. 在 Obsidian 中打开笔记或选中文字 — Claude Code 会自动将该文件和选中内容作为上下文

> **注意：** Claude Code 必须从 vault 目录启动，否则无法匹配工作区。

---

An Obsidian plugin that bridges your active note and text selection to the [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI in real-time.

When you open a note or select text in Obsidian, the adjacent terminal running Claude Code automatically shows the file as context — just like VS Code.

## Usage

1. Enable the plugin in Obsidian
2. Open a terminal **in your vault directory**
3. Run `claude`
4. Run `/ide` to connect to Obsidian
5. Open a note or select text in Obsidian — Claude Code automatically picks up the file and selection as context

> **Important:** Claude Code must be started from the vault directory for workspace matching to work.

---

## License

MIT
