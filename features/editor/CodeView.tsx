"use client";

import React, { useCallback, useMemo, useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { useWorkspaceStore } from "@/context";
import { useTheme } from "next-themes";
import { tags as t } from "@lezer/highlight";
import { createTheme } from "@uiw/codemirror-themes";
import { inlineSuggestion } from "./inlineSuggestion";

const lightTheme = createTheme({
  theme: "light",
  settings: {
    background: "var(--background)",
    foreground: "#4d4d4c",
    caret: "#aeafad",
    selection: "#d6d6d6",
    selectionMatch: "#d6d6d6",
    lineHighlight: "#efefef",
    gutterBackground: "var(--background)",
    gutterForeground: "#4d4d4c",
  },
  styles: [
    { tag: t.comment, color: "#8e908c" },
    { tag: t.variableName, color: "#c82829" },
    { tag: [t.string, t.special(t.brace)], color: "#718c00" },
    { tag: t.number, color: "#f5871f" },
    { tag: t.bool, color: "#f5871f" },
    { tag: t.null, color: "#f5871f" },
    { tag: t.keyword, color: "#8959a8" },
    { tag: t.operator, color: "#3e999f" },
    { tag: t.className, color: "#eab700" },
    { tag: t.definition(t.typeName), color: "#eab700" },
    { tag: t.typeName, color: "#eab700" },
    { tag: t.angleBracket, color: "#3e999f" },
    { tag: t.tagName, color: "#c82829" },
    { tag: t.attributeName, color: "#eab700" },
  ],
});

const darkTheme = createTheme({
  theme: "dark",
  settings: {
    background: "var(--background)",
    foreground: "#9cdcfe",
    caret: "#c6c6c6",
    selection: "#6199ff2f",
    selectionMatch: "#72a1ff59",
    lineHighlight: "#ffffff0f",
    gutterBackground: "var(--background)",
    gutterForeground: "#838383",
  },
  styles: [
    { tag: t.keyword, color: "#569cd6" },
    {
      tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
      color: "#9cdcfe",
    },
    { tag: [t.function(t.variableName), t.labelName], color: "#dcdcaa" },
    {
      tag: [t.color, t.constant(t.name), t.standard(t.name)],
      color: "#569cd6",
    },
    { tag: [t.definition(t.name), t.separator], color: "#9cdcfe" },
    { tag: [t.brace], color: "#9cdcfe" },
    { tag: [t.annotation], color: "#dcdcaa" },
    {
      tag: [t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace],
      color: "#b5cea8",
    },
    { tag: [t.typeName, t.className], color: "#4ec9b0" },
    { tag: [t.operator, t.operatorKeyword], color: "#d4d4d4" },
    { tag: [t.tagName], color: "#569cd6" },
    { tag: [t.squareBracket], color: "#ffd700" },
    { tag: [t.angleBracket], color: "#808080" },
    { tag: [t.attributeName], color: "#9cdcfe" },
    { tag: [t.regexp], color: "#d16969" },
    { tag: [t.quote], color: "#6a9955" },
    { tag: [t.string], color: "#ce9178" },
    { tag: t.link, color: "#569cd6", textDecoration: "underline" },
    { tag: [t.url, t.escape, t.special(t.string)], color: "#d4d4d4" },
    { tag: [t.meta], color: "#d4d4d4" },
    { tag: [t.comment], color: "#6a9955", fontStyle: "italic" },
  ],
});

import { X } from "lucide-react";
import { getFileIcon } from "./utils";

export default function CodeView() {
  const {
    currentWorkspace,
    activeFile,
    updateFiles,
    openFiles,
    setActiveFile,
    closeFile,
  } = useWorkspaceStore();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getLanguage = useCallback((filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return javascript({ jsx: true, typescript: true });
      case "html":
        return html();
      case "css":
        return css();
      case "json":
        return json();
      default:
        return javascript();
    }
  }, []);

  const fileContent = useMemo(() => {
    if (!currentWorkspace || !activeFile) return null;
    return currentWorkspace.files[activeFile]?.content ?? "";
  }, [currentWorkspace, activeFile]);

  const onChange = useCallback(
    (value: string) => {
      if (!currentWorkspace || !activeFile) return;

      const newFiles = { ...currentWorkspace.files };
      newFiles[activeFile] = {
        ...newFiles[activeFile],
        content: value,
      };

      updateFiles(newFiles);
    },
    [currentWorkspace, activeFile, updateFiles]
  );

  const aiCompletionExtension = useMemo(() => {
    if (!activeFile) return [];

    return inlineSuggestion(async (state) => {
      const pos = state.selection.main.head;
      const line = state.doc.lineAt(pos);
      const after = line.text.slice(pos - line.from);
      const before = line.text.slice(0, pos - line.from);

      // Only suggest if there's some context on the current line (at least 3 chars)
      // or if we have significant cross-line prefix context.
      if (before.trim().length < 3 && state.doc.length < 50) return null;

      // Only suggest at end of line or before whitespace
      if (after.trim().length > 0) return null;

      const prefix = state.doc.sliceString(0, pos);
      const suffix = state.doc.sliceString(pos);

      try {
        const response = await fetch("/api/completion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prefix,
            suffix,
            language: activeFile.split(".").pop() || "javascript",
            fileName: activeFile,
          }),
        });

        const data = await response.json();
        return data.completion || null;
      } catch (e) {
        console.error("AI Completion error:", e);
        return null;
      }
    });
  }, [activeFile]);

  if (!activeFile && openFiles.length === 0) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center text-muted-foreground select-none">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-2">
            <span className="text-3xl">⌨️</span>
          </div>
          <p className="text-sm font-medium">
            Select a file to view its content
          </p>
          <p className="text-xs opacity-50">
            Choose a file from the explorer on the left
          </p>
        </div>
      </div>
    );
  }

  const currentTheme =
    mounted && (resolvedTheme === "light" || theme === "light")
      ? lightTheme
      : darkTheme;

  return (
    <div className="h-full w-full bg-background flex flex-col">
      {/* Tabs Header */}
      <div className="flex items-center h-9 border-b border-border bg-muted/20 overflow-x-auto scrollbar-hide">
        {openFiles.map((file) => (
          <div
            key={file}
            className={`
              group flex items-center gap-2 px-3 h-full text-xs font-medium cursor-pointer border-r border-border/50 min-w-30 max-w-50 hover:bg-background/50 transition-colors
              ${
                activeFile === file
                  ? "bg-background text-foreground border-t-2 border-t-primary"
                  : "text-muted-foreground bg-transparent border-t-2 border-t-transparent"
              }
            `}
            onClick={() => setActiveFile(file)}
          >
            {getFileIcon(file)}
            <span className="truncate flex-1">{file.split("/").pop()}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file);
              }}
              className={`opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 p-0.5 rounded-sm transition-all ${
                activeFile === file ? "opacity-100" : ""
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden relative">
        {mounted && activeFile && (
          <CodeMirror
            value={fileContent || ""}
            height="100%"
            theme={currentTheme}
            extensions={[getLanguage(activeFile), aiCompletionExtension]}
            onChange={onChange}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              history: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: false,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              defaultKeymap: true,
              searchKeymap: true,
              historyKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
            className="h-full text-sm"
          />
        )}
        {mounted && !activeFile && openFiles.length > 0 && (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            Select a tab
          </div>
        )}
      </div>
    </div>
  );
}
