import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
  keymap,
} from "@codemirror/view";
import {
  StateField,
  StateEffect,
  EditorState,
  Transaction,
  Facet,
} from "@codemirror/state";
import { Prec } from "@codemirror/state";

// Effect to set the current suggestion
export const setSuggestion = StateEffect.define<{
  text: string;
  pos: number;
} | null>();

// Field to store the suggestion state
const suggestField = StateField.define<{ text: string; pos: number } | null>({
  create() {
    return null;
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setSuggestion)) return effect.value;
    }
    // Clear suggestion if document changes or selection changes (unless it's our own transaction)
    if (tr.docChanged || tr.selection) return null;
    return value;
  },
  provide: (f) => [
    EditorView.decorations.from(f, (value) => {
      if (!value || !value.text) return Decoration.none;
      return Decoration.set([
        Decoration.widget({
          widget: new GhostTextWidget(value.text),
          side: 1,
        }).range(value.pos),
      ]);
    }),
  ],
});

class GhostTextWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }
  eq(other: GhostTextWidget) {
    return other.text === this.text;
  }
  toDOM() {
    const span = document.createElement("span");
    span.style.opacity = "0.4";
    span.style.color = "gray";
    span.style.pointerEvents = "none";
    span.style.userSelect = "none";
    span.style.fontStyle = "italic";
    span.style.whiteSpace = "pre";
    span.textContent = this.text;
    return span;
  }
  ignoreEvent() {
    return true;
  }
}

// Facet to provide the completion function
const suggestionSource =
  Facet.define<(state: EditorState) => Promise<string | null>>();

// Command to accept the suggestion
const acceptSuggestion = (view: EditorView) => {
  const suggest = view.state.field(suggestField);
  if (!suggest || !suggest.text) return false;

  view.dispatch({
    changes: { from: suggest.pos, insert: suggest.text },
    selection: { anchor: suggest.pos + suggest.text.length },
    effects: setSuggestion.of(null),
  });
  return true;
};

// Extension implementation
export function inlineSuggestion(
  source: (state: EditorState) => Promise<string | null>
) {
  return [
    suggestField,
    suggestionSource.of(source),
    Prec.highest(
      keymap.of([
        {
          key: "Tab",
          run: acceptSuggestion,
        },
      ])
    ),
    EditorView.updateListener.of((update) => {
      // 1. If document changed, always clear current suggestion immediately
      if (update.docChanged) {
        update.view.dispatch({ effects: setSuggestion.of(null) });
      }

      // 2. Only fetch if doc changed (not just selection) and we don't have a suggestion
      if (update.docChanged) {
        fetchSuggestion(update.view);
      }
    }),
  ];
}

let pendingFetch: any = null;

async function fetchSuggestion(view: EditorView) {
  if (pendingFetch) clearTimeout(pendingFetch);

  pendingFetch = setTimeout(async () => {
    const sources = view.state.facet(suggestionSource);
    if (sources.length === 0) return;

    const source = sources[0];
    const suggestion = await source(view.state);

    if (suggestion) {
      view.dispatch({
        effects: setSuggestion.of({
          text: suggestion,
          pos: view.state.selection.main.head,
        }),
      });
    }
  }, 1200); // Increased to 1.2s to reduce aggressive requests
}
