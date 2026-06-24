// Application State
let state = {
  solved: [],       // Array of solved question IDs
  favorites: [],    // Array of favorited question IDs
  recent: [],       // Queue of recently viewed question IDs (max 5)
  currentId: 1,     // Current practice question ID
  drafts: {},       // Map of question ID to draft code written by user
  theme: "dark",    // Current theme
  searchQuery: "",  // Active search query
  filterCategory: "all", // Active category pill filter
  filterDifficulty: null, // Active difficulty filter ("easy" | "medium" | null)
  includeSysout: false, // Toggle to add System.out.println statement in copied text
  
  // Study Hub Fields
  studyActiveModule: "m1", // Current active module ID
  studyActiveStep: null,   // Current active step object (currently studying)
  studyActiveCardIdx: 0,   // Index of current flashcard being viewed
  studyMastered: {},       // Map of step path -> array of mastered question indices
  studyViewMode: "flashcard", // Current study view mode ("flashcard" | "qalist")
  studySearchQuery: ""    // Current search term in study modal
};

// Initialize State from LocalStorage
function loadState() {
  const localSolved = localStorage.getItem("j8_solved");
  const localFav = localStorage.getItem("j8_favorites");
  const localRecent = localStorage.getItem("j8_recent");
  const localCurrent = localStorage.getItem("j8_currentId");
  const localDrafts = localStorage.getItem("j8_drafts");
  const localTheme = localStorage.getItem("j8_theme");
  const localSysout = localStorage.getItem("j8_include_sysout");
  const localStudyMastered = localStorage.getItem("j8_study_mastered");
  const localStudyModule = localStorage.getItem("j8_study_active_module");

  if (localSolved) state.solved = JSON.parse(localSolved);
  if (localFav) state.favorites = JSON.parse(localFav);
  if (localRecent) state.recent = JSON.parse(localRecent);
  if (localCurrent) state.currentId = parseInt(localCurrent, 10);
  if (localDrafts) state.drafts = JSON.parse(localDrafts);
  if (localSysout) state.includeSysout = JSON.parse(localSysout);
  if (localStudyMastered) state.studyMastered = JSON.parse(localStudyMastered);
  if (localStudyModule) state.studyActiveModule = localStudyModule;
  if (localTheme) {
    state.theme = localTheme;
  } else {
    // Detect OS theme preference default
    state.theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  // Double check currentId ranges
  if (!questions.find(q => q.id === state.currentId)) {
    state.currentId = 1;
  }
}

function saveState() {
  localStorage.setItem("j8_solved", JSON.stringify(state.solved));
  localStorage.setItem("j8_favorites", JSON.stringify(state.favorites));
  localStorage.setItem("j8_recent", JSON.stringify(state.recent));
  localStorage.setItem("j8_currentId", state.currentId.toString());
  localStorage.setItem("j8_drafts", JSON.stringify(state.drafts));
  localStorage.setItem("j8_theme", state.theme);
  localStorage.setItem("j8_include_sysout", JSON.stringify(state.includeSysout));
  localStorage.setItem("j8_study_mastered", JSON.stringify(state.studyMastered || {}));
  localStorage.setItem("j8_study_active_module", state.studyActiveModule || "m1");
}

// Helper to escape HTML characters
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Custom Java Code Syntax Highlighter
function highlightJavaCode(code) {
  // Escape HTML tags
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const strings = [];
  const comments = [];

  // Replace string literals with placeholders
  html = html.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, (match) => {
    strings.push(`<span class="j-string">${match}</span>`);
    return `___STR_PLACEHOLDER_${strings.length - 1}___`;
  });

  // Replace comments with placeholders
  html = html.replace(/\/\/.*/g, (match) => {
    comments.push(`<span class="j-comment">${match}</span>`);
    return `___COM_PLACEHOLDER_${comments.length - 1}___`;
  });

  // Highlight operators and symbols (:: and ->)
  html = html.replace(/(::|-&gt;)/g, '<span class="j-operator">$1</span>');

  // Highlight Java core control/type keywords
  const keywords = /\b(if|else|new|return|int|char|double|boolean|void)\b/g;
  html = html.replace(keywords, '<span class="j-keyword">$1</span>');

  // Highlight structural types and variables
  const types = /\b(IntStream|Stream|Collectors|Arrays|Comparator|System|out|Function|LocalDate|ChronoUnit|String|Integer|StringBuffer|Character|birthDay|today|set|list|listOfIntegers|listOfStrings|anyList|inputString|inputNumber|inputArray|a|b|list1|list2|str|str1|str2)\b/g;
  html = html.replace(types, '<span class="j-type">$1</span>');

  // Highlight method chain APIs
  const methods = /\b(stream|collect|filter|map|mapToObj|sorted|distinct|limit|skip|forEach|toArray|sum|average|getAsDouble|get|between|iterate|split|toUpperCase|valueOf|isDigit|charAt|noneMatch|rangeClosed|range|joining|partitioningBy|toList|groupingBy|counting|identity|reverseOrder|naturalOrder|comparing|length|contains|println|print|now|of|add|toSet)\b/g;
  html = html.replace(methods, '<span class="j-method">$1</span>');

  // Highlight numbers
  html = html.replace(/\b(\d+)\b/g, '<span class="j-number">$1</span>');

  // Restore comments and strings
  for (let i = 0; i < comments.length; i++) {
    html = html.replace(`___COM_PLACEHOLDER_${i}___`, comments[i]);
  }
  for (let i = 0; i < strings.length; i++) {
    html = html.replace(`___STR_PLACEHOLDER_${i}___`, strings[i]);
  }

  return html;
}

// Save the current code draft from the active Monaco editor(s) to state.drafts
// Monaco auto-saves via onDidChangeModelContent, so state.drafts is always current.
// This function is kept for compatibility with nav-away triggers.
function saveActiveWidgetDraft() {
  // Drafts are continuously saved inside loadCompilerWidget's onDidChangeModelContent.
  // Just persist whatever is already in state.drafts.
  saveState();
}

// Executes code via the onlinecompiler.io REST API through a CORS proxy (Cloudflare Worker)
// → Deploy cloudflare-worker/worker.js to Cloudflare, then paste your worker URL below
const PROXY_URL = "https://wandering-pine-c536.abudhar15.workers.dev";

// If a Java snippet has no class declaration, wrap it in a runnable boilerplate
// so users can type just the stream/lambda expression and hit Run immediately
function wrapJavaCode(code) {
  // Already a complete program — leave it alone
  if (/\bclass\s+\w+/.test(code)) return code;

  // Indent the snippet by 8 spaces inside main()
  const indented = code
    .split("\n")
    .map(line => "        " + line)
    .join("\n");

  return `import java.util.*;
import java.util.stream.*;
import java.util.function.*;
import java.util.Optional;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
${indented}
    }
}`;
}

async function runCodeWithPiston(language, code) {
  // Compiler IDs from https://api.onlinecompiler.io/api/compilers/
  const compilerMap = {
    java:       "openjdk-25",
    python:     "python-3.14",
    javascript: "typescript-deno",
    cpp:        "g++-15",
    go:         "go-1.26",
    rust:       "rust-1.93",
  };
  const compiler = compilerMap[language] || "openjdk-25";

  // Auto-wrap Java snippets into a full runnable program
  const finalCode = (language === "java") ? wrapJavaCode(code) : code;

  // Call the CORS proxy worker — it forwards to api.onlinecompiler.io with the API key
  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ compiler, code: finalCode, input: "" }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `API error ${response.status}`);
  }

  const data = await response.json();
  if (data.error && data.error.trim()) return data.error;
  return (data.output && data.output.trim()) ? data.output : "(no output)";
}



// ── Monaco Editor integration ─────────────────────────────────────────────────
// Loads Monaco from CDN once and calls back when ready
let _monacoCallbacks = [];
function ensureMonaco(cb) {
  if (window.monaco) { cb(); return; }
  _monacoCallbacks.push(cb);
  if (_monacoCallbacks.length > 1) return; // already loading
  const s = document.createElement("script");
  s.src = "https://unpkg.com/monaco-editor@0.52.2/min/vs/loader.js";
  s.onload = () => {
    window.require.config({ paths: { vs: "https://unpkg.com/monaco-editor@0.52.2/min/vs" } });
    window.require(["vs/editor/editor.main"], () => {
      _registerJava8Completions();
      _monacoCallbacks.forEach(f => f());
      _monacoCallbacks = [];
    });
  };
  document.head.appendChild(s);
}

// Registers Java 8 Stream API autocomplete suggestions in Monaco
// Registers Java 8 Stream API and local variable autocomplete suggestions in Monaco
function _registerJava8Completions() {
  monaco.languages.registerCompletionItemProvider("java", {
    triggerCharacters: [".", " "],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
        startColumn: word.startColumn,        endColumn: word.endColumn,
      };
      
      const mk = monaco.languages.CompletionItemKind;
      const Rule = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;

      // Determine if this is a member access (preceded by a dot)
      const lineContent = model.getLineContent(position.lineNumber);
      const beforeWord = lineContent.substring(0, word.startColumn - 1).trim();
      const isMemberAccess = beforeWord.endsWith(".");

      if (isMemberAccess) {
        // Only suggest member methods that can be chained after a dot
        const memberMethods = [
          ["stream()",                       "Create a stream from collection",             "stream()",                            mk.Method],
          ["filter()",                        "Keep elements matching predicate",            "filter(${1:x -> x})",                 mk.Method],
          ["map()",                           "Transform each element",                     "map(${1:x -> x})",                    mk.Method],
          ["flatMap()",                       "Flatten nested streams",                     "flatMap(${1:x -> x.stream()})",       mk.Method],
          ["mapToInt()",                      "Map to IntStream",                           "mapToInt(${1:Integer::intValue})",    mk.Method],
          ["collect()",                       "Collect stream to collection",               "collect(${1:Collectors.toList()})",   mk.Method],
          ["forEach()",                       "Iterate each element",                      "forEach(${1:System.out::println})",   mk.Method],
          ["sorted()",                        "Sort elements (natural order)",              "sorted()",                            mk.Method],
          ["sorted(Comparator)",              "Sort with comparator",                      "sorted(${1:Comparator.reverseOrder()})", mk.Method],
          ["distinct()",                      "Remove duplicates",                         "distinct()",                          mk.Method],
          ["limit()",                         "Limit stream to n elements",                "limit(${1:10})",                      mk.Method],
          ["skip()",                          "Skip first n elements",                     "skip(${1:5})",                        mk.Method],
          ["count()",                         "Count elements in stream",                  "count()",                             mk.Method],
          ["findFirst()",                     "Return first element as Optional",          "findFirst()",                         mk.Method],
          ["findAny()",                       "Return any element as Optional",            "findAny()",                           mk.Method],
          ["reduce()",                        "Reduce stream to single value",             "reduce(${1:0}, ${2:Integer::sum})",   mk.Method],
          ["anyMatch()",                      "True if any element matches",               "anyMatch(${1:x -> x})",               mk.Method],
          ["allMatch()",                      "True if all elements match",                "allMatch(${1:x -> x})",               mk.Method],
          ["noneMatch()",                     "True if no element matches",                "noneMatch(${1:x -> x})",              mk.Method],
          ["min()",                           "Find minimum element",                      "min(${1:Comparator.naturalOrder()})", mk.Method],
          ["max()",                           "Find maximum element",                      "max(${1:Comparator.naturalOrder()})", mk.Method],
          ["peek()",                          "Peek at each element (debug)",              "peek(${1:System.out::println})",      mk.Method],
          ["length()",                         "Get string length",                         "length()",                            mk.Method],
          ["toUpperCase()",                    "Convert string to uppercase",               "toUpperCase()",                       mk.Method],
          ["toLowerCase()",                    "Convert string to lowercase",               "toLowerCase()",                       mk.Method],
          ["charAt()",                         "Get character at index",                    "charAt(${1:0})",                      mk.Method],
        ];

        return {
          suggestions: memberMethods.map(([label, detail, insertText, kind]) => ({
            label, kind, detail, insertText, range,
            insertTextRules: Rule,
          })),
        };
      } else {
        // Not a member access: suggest local variables, static classes, references, and helpers
        const text = model.getValue();
        const foundVars = new Set();
        
        // Excluded Java keywords/types that shouldn't be suggested as custom variables
        const excluded = new Set([
          "public", "private", "protected", "class", "interface", "void", "return",
          "new", "if", "else", "for", "while", "do", "static", "final", "import", "package",
          "true", "false", "null", "this", "super", "throws", "throw", "try", "catch", "finally",
          "int", "double", "float", "long", "short", "byte", "char", "boolean", "String"
        ]);

        // Regex to find variable declarations: e.g. List<String> list = ... or int count = ...
        const varRegex = /\b([A-Za-z_][A-Za-z0-9_<>,\s\?\[\]]*)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:=|,|;|:|\))/g;
        // Regex to find lambda parameters: e.g. s -> ...
        const lambdaRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\s*->/g;

        let m;
        while ((m = varRegex.exec(text)) !== null) {
          const varName = m[2];
          if (!excluded.has(varName) && !/^\d+$/.test(varName)) {
            foundVars.add(varName);
          }
        }
        while ((m = lambdaRegex.exec(text)) !== null) {
          const varName = m[1];
          if (!excluded.has(varName) && !/^\d+$/.test(varName)) {
            foundVars.add(varName);
          }
        }

        const varSuggestions = Array.from(foundVars).map(v => ({
          label: v,
          kind: mk.Variable,
          detail: "Local Variable",
          insertText: v,
          range: range
        }));

        const staticHelpers = [
          // Collectors
          ["Collectors.toList()",             "Collect to ArrayList",                      "Collectors.toList()",                  mk.Class],
          ["Collectors.toSet()",              "Collect to HashSet",                        "Collectors.toSet()",                   mk.Class],
          ["Collectors.toUnmodifiableList()", "Collect to unmodifiable List",              "Collectors.toUnmodifiableList()",      mk.Class],
          ["Collectors.joining()",            "Join strings with delimiter",               "Collectors.joining(\"${1:, }\")",     mk.Class],
          ["Collectors.joining(d,p,s)",       "Join with delimiter, prefix, suffix",       "Collectors.joining(\"${1:,}\", \"${2:Prefix}\", \"${3:Suffix}\")", mk.Class],
          ["Collectors.groupingBy()",         "Group elements by classifier",              "Collectors.groupingBy(${1:Function.identity()})", mk.Class],
          ["Collectors.counting()",           "Count elements per group",                  "Collectors.counting()",                mk.Class],
          ["Collectors.partitioningBy()",     "Partition into two groups (true/false)",   "Collectors.partitioningBy(${1:x -> x % 2 == 0})", mk.Class],
          ["Collectors.toMap()",              "Collect to Map",                            "Collectors.toMap(${1:k -> k}, ${2:v -> v})", mk.Class],
          ["Collectors.summarizingInt()",     "Get IntSummaryStatistics",                  "Collectors.summarizingInt(${1:Integer::intValue})", mk.Class],
          // Method references
          ["System.out::println",             "Print each element",                        "System.out::println",                  mk.Reference],
          ["Integer::parseInt",               "Parse String to int",                       "Integer::parseInt",                    mk.Reference],
          ["Integer::intValue",               "Unbox Integer to int",                      "Integer::intValue",                    mk.Reference],
          ["String::valueOf",                 "Convert to String",                         "String::valueOf",                      mk.Reference],
          ["String::toUpperCase",             "Map to uppercase",                          "String::toUpperCase",                  mk.Reference],
          ["String::toLowerCase",             "Map to lowercase",                          "String::toLowerCase",                  mk.Reference],
          ["String::length",                  "Get string length",                         "String::length",                       mk.Reference],
          ["Function.identity()",             "Returns the input unchanged",               "Function.identity()",                  mk.Class],
          ["Comparator.reverseOrder()",       "Reverse/descending comparator",             "Comparator.reverseOrder()",            mk.Class],
          ["Comparator.naturalOrder()",       "Natural/ascending comparator",              "Comparator.naturalOrder()",            mk.Class],
          ["Comparator.comparing()",          "Compare by key extractor",                  "Comparator.comparing(${1:x -> x})",   mk.Class],
          // Optional
          ["Optional.of()",                   "Wrap non-null value in Optional",           "Optional.of(${1:value})",              mk.Class],
          ["Optional.empty()",                "Create empty Optional",                     "Optional.empty()",                     mk.Class],
          ["Optional.ofNullable()",           "Wrap nullable value in Optional",           "Optional.ofNullable(${1:value})",      mk.Class],
          // Helpers
          ["Arrays.asList()",                 "Create fixed-size list",                    "Arrays.asList(${1})",                  mk.Class],
          ["Collections.sort()",              "Sort a list in place",                      "Collections.sort(${1:list})",          mk.Class],
          ["System.out.println()",            "Print line to console",                     "System.out.println(${1})",             mk.Function],
        ];

        const staticSuggestions = staticHelpers.map(([label, detail, insertText, kind]) => ({
          label, kind, detail, insertText, range,
          insertTextRules: Rule,
        }));

        return {
          suggestions: [...varSuggestions, ...staticSuggestions],
        };
      }
    },
  });
}

// Builds and injects a Monaco-powered IDE into the given container
function loadCompilerWidget(containerId, widgetId, draftKey, defaultCode, expectedOutput) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  let initialCode = state.drafts[draftKey];
  if (!initialCode) {
    initialCode = (defaultCode && !/\bclass\s+\w+/.test(defaultCode)) ? wrapJavaCode(defaultCode) : (defaultCode || "");
  }
  const isDark      = state.theme === "dark";

  // Monaco language IDs per compiler key
  const monacoLangMap = {
    java: "java", python: "python", javascript: "typescript",
    cpp: "cpp",   go: "go",         rust: "rust",
  };

  // ── Wrapper HTML ─────────────────────────────────────────────────────────
  const wrapper = document.createElement("div");
  wrapper.className = "custom-compiler" + (isDark ? " dark" : "");
  wrapper.id = widgetId;

  wrapper.innerHTML = `
    <div class="cc-header">
      <select class="cc-lang-select" id="${widgetId}-lang">
        <option value="java" selected>Java (OpenJDK 25)</option>
        <option value="python">Python 3.14</option>
        <option value="javascript">TypeScript / Deno</option>
        <option value="cpp">C++ (G++ 15)</option>
        <option value="go">Go 1.26</option>
        <option value="rust">Rust 1.93</option>
      </select>
      <div class="cc-status" id="${widgetId}-status">
        <span class="cc-dot cc-dot--idle"></span>
        <span class="cc-status-text">Loading editor\u2026</span>
      </div>
      <button class="cc-run-btn" id="${widgetId}-run-btn" disabled>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Run
      </button>
    </div>
    <div class="cc-body">
      <div id="${widgetId}-monaco" class="cc-monaco-host"></div>
    </div>
    <div class="cc-output-section" id="${widgetId}-output-section" style="display:none;">
      <div class="cc-output-header">
        <span class="cc-output-title">Output</span>
        <button class="cc-clear-btn" id="${widgetId}-clear-btn">Clear</button>
      </div>
      <pre class="cc-output" id="${widgetId}-output"></pre>
    </div>
  `;

  container.appendChild(wrapper);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const runBtn        = document.getElementById(`${widgetId}-run-btn`);
  const statusEl      = document.getElementById(`${widgetId}-status`);
  const outputSection = document.getElementById(`${widgetId}-output-section`);
  const outputEl      = document.getElementById(`${widgetId}-output`);
  const clearBtn      = document.getElementById(`${widgetId}-clear-btn`);
  const langSelect    = document.getElementById(`${widgetId}-lang`);
  let   editorInst    = null;

  // ── Load Monaco ──────────────────────────────────────────────────────────
  ensureMonaco(() => {
    const host = document.getElementById(`${widgetId}-monaco`);
    if (!host) return;

    editorInst = monaco.editor.create(host, {
      value:                  initialCode,
      language:               monacoLangMap[langSelect.value] || "java",
      theme:                  isDark ? "vs-dark" : "vs",
      fontSize:               13.5,
      fontFamily:             "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontLigatures:          true,
      lineNumbers:            "on",
      minimap:                { enabled: false },
      scrollBeyondLastLine:   false,
      automaticLayout:        true,
      tabSize:                4,
      wordWrap:               "on",
      padding:                { top: 14, bottom: 14 },
      suggestOnTriggerCharacters: true,
      quickSuggestions:       { other: true, comments: false, strings: false },
      wordBasedSuggestions:   "currentDocument",
      acceptSuggestionOnEnter: "on",
      roundedSelection:       true,
      cursorBlinking:         "smooth",
      smoothScrolling:        true,
      scrollbar:              { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
    });

    // Auto-save draft on every change
    editorInst.onDidChangeModelContent(() => {
      state.drafts[draftKey] = editorInst.getValue();
      saveState();
    });

    // Switch language when selector changes
    langSelect.addEventListener("change", () => {
      const lang = monacoLangMap[langSelect.value] || "java";
      monaco.editor.setModelLanguage(editorInst.getModel(), lang);
    });

    // Enable run button now that editor is ready
    runBtn.disabled = false;
    setStatus(statusEl, "idle", "Ready");
  });

  // ── Clear output ─────────────────────────────────────────────────────────
  clearBtn.addEventListener("click", () => {
    outputEl.textContent = "";
    outputEl.className = "cc-output";
    outputSection.style.display = "none";
  });

  // ── Run button ────────────────────────────────────────────────────────────
  runBtn.addEventListener("click", async () => {
    const code = editorInst ? editorInst.getValue().trim() : "";
    if (!code) return;

    runBtn.disabled = true;
    runBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg> Running\u2026`;
    setStatus(statusEl, "running", "Running\u2026");
    outputSection.style.display = "block";
    outputEl.className = "cc-output";
    outputEl.textContent = "Executing\u2026";

    try {
      const result = await runCodeWithPiston(langSelect.value, code);

      // ── Answer check ───────────────────────────────────────────────────
      const normalize  = s => s.replace(/\s+/g, " ").trim();
      const isCorrect  = expectedOutput &&
        normalize(result) === normalize(String(expectedOutput));

      if (isCorrect) {
        outputEl.className = "cc-output cc-output--correct";
        outputEl.innerHTML =
          `<span class="cc-verdict cc-verdict--correct">\u2705 Correct Answer!</span>\n${escapeHtml(result)}`;
        setStatus(statusEl, "success", "Correct! \uD83C\uDF89");
        startConfetti();
        
        if (typeof draftKey === "string" && draftKey.startsWith("study_")) {
          // Format: study_path_index
          // E.g., study_module1/step1_0
          const parts = draftKey.split("_");
          if (parts.length >= 3) {
            const originalIndex = parseInt(parts.pop(), 10);
            const relPath = parts.slice(1).join("_");
            
            if (!state.studyMastered[relPath]) {
              state.studyMastered[relPath] = [];
            }
            if (!state.studyMastered[relPath].includes(originalIndex)) {
              state.studyMastered[relPath].push(originalIndex);
              saveState();
              
              // Update study session UI if still on this card
              if (state.studyActiveStep && state.studyActiveStep.rel_path === relPath) {
                const masteredBtn = document.getElementById("study-session-mastered-btn");
                const masteredText = document.getElementById("study-session-mastered-text");
                if (masteredBtn && masteredText) {
                  masteredText.textContent = "Mastered";
                  masteredBtn.style.backgroundColor = "var(--accent-success)";
                }
              }
            }
          }
        } else {
          // It's a normal practice question
          const qId = parseInt(draftKey, 10);
          if (!isNaN(qId)) {
            if (!state.solved.includes(qId)) {
              state.solved.push(qId);
              saveState();
              updateGlobalProgress();
              
              // Update practice page solved button directly if it's the current question
              if (qId === state.currentId) {
                const solvedText = document.getElementById("practice-mark-solved-text");
                const solvedBtn = document.getElementById("practice-mark-solved-btn");
                if (solvedText && solvedBtn) {
                  solvedText.textContent = "Solved";
                  solvedBtn.style.backgroundColor = "var(--accent-success)";
                }
              }
            }
          }
        }
      } else {
        outputEl.className = "cc-output cc-output--wrong";
        const hint = expectedOutput
          ? `\n\n\u274C Expected:\n${expectedOutput}`
          : "";
        outputEl.innerHTML =
          `<span class="cc-verdict cc-verdict--wrong">\u274C Not quite right</span>\n${escapeHtml(result)}${hint ? `<span class="cc-expected">${escapeHtml(hint)}</span>` : ""}`;
        setStatus(statusEl, "error", "Try again");
      }
    } catch (err) {
      outputEl.className = "cc-output";
      outputEl.textContent = "\u274c " + err.message;
      setStatus(statusEl, "error", "Error");
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run`;
      setTimeout(() => setStatus(statusEl, "idle", "Ready"), 4000);
    }
  });
}

// Helper: update the status indicator inside the editor header
function setStatus(statusEl, type, text) {
  statusEl.innerHTML = `<span class="cc-dot cc-dot--${type}"></span><span class="cc-status-text">${text}</span>`;
}

// Reusable Toast Alerts
function showToast(message, type = "success") {
  const toast = document.getElementById("custom-alert-toast");
  const msgText = document.getElementById("custom-alert-msg");

  toast.className = `custom-alert ${type}`;
  msgText.textContent = message;

  // Animate in
  toast.classList.add("show");

  // Reset previous timer if active
  if (window.toastTimeout) clearTimeout(window.toastTimeout);

  // Animate out
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Confetti Particle Engine
let confettiActive = false;
let confettiParticles = [];
const confettiColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a78bfa", "#3b82f6"];

class ConfettiParticle {
  constructor(canvasWidth, canvasHeight) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * -canvasHeight - 20;
    this.r = Math.random() * 6 + 5;
    this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    this.tilt = Math.random() * 10 - 5;
    this.tiltAngleIncremental = Math.random() * 0.07 + 0.02;
    this.tiltAngle = 0;
    this.speedY = Math.random() * 3 + 2;
    this.speedX = Math.random() * 2 - 1;
  }
  update(canvasWidth, canvasHeight) {
    this.tiltAngle += this.tiltAngleIncremental;
    this.y += this.speedY;
    this.x += this.speedX;
    this.tilt = Math.sin(this.tiltAngle) * 12;
    return this.y < canvasHeight && this.x > -20 && this.x < canvasWidth + 20;
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.lineWidth = this.r;
    ctx.strokeStyle = this.color;
    ctx.moveTo(this.x + this.tilt + this.r / 2, this.y);
    ctx.lineTo(this.x + this.tilt, this.y + this.tilt + this.r / 2);
    ctx.stroke();
  }
}

function startConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  confettiParticles = [];
  for (let i = 0; i < 150; i++) {
    confettiParticles.push(new ConfettiParticle(canvas.width, canvas.height));
  }

  if (!confettiActive) {
    confettiActive = true;
    animateConfetti(canvas, ctx);
  }
}

function animateConfetti(canvas, ctx) {
  if (confettiParticles.length === 0) {
    confettiActive = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  confettiParticles = confettiParticles.filter(p => p.update(canvas.width, canvas.height));
  confettiParticles.forEach(p => p.draw(ctx));

  requestAnimationFrame(() => animateConfetti(canvas, ctx));
}

window.addEventListener("resize", () => {
  const canvas = document.getElementById("confetti-canvas");
  if (canvas && confettiActive) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});

// View Switching Manager
function switchToView(viewName) {
  // Save any active widget drafts before switching views
  saveActiveWidgetDraft();

  // Hide all panels
  document.querySelectorAll(".view-panel").forEach(panel => {
    panel.classList.remove("active");
  });

  // Show target panel
  const targetPanel = document.getElementById(`view-${viewName}`);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }

  // Update active states in Sidebar (highlight study-hub sidebar tab during study-session too)
  document.querySelectorAll(".sidebar-item-link").forEach(link => {
    const view = link.getAttribute("data-view");
    if (view === viewName || (view === "study-hub" && viewName === "study-session")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Handle post-switch setup
  if (viewName === "home") {
    renderHomeView();
  } else if (viewName === "all-questions") {
    renderAllQuestionsTable();
  } else if (viewName === "practice") {
    renderPracticeQuestion();
  } else if (viewName === "solved") {
    renderSolvedListView();
  } else if (viewName === "progress") {
    renderProgressDashboard();
  } else if (viewName === "study-hub") {
    renderStudyHub();
  } else if (viewName === "study-session") {
    renderStudySession();
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

// Add viewed question to Recently Viewed list (maintaining limit of 5, unique items)
function addToRecentlyViewed(id) {
  state.recent = state.recent.filter(x => x !== id);
  state.recent.unshift(id);
  if (state.recent.length > 5) {
    state.recent.pop();
  }
  saveState();
}

// Global Progress Calculations
function getProgressStats() {
  const total = questions.length;
  const solved = state.solved.length;
  const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
  return { total, solved, percentage };
}

// Update Global Progress Displays in Top Bar
function updateGlobalProgress() {
  const stats = getProgressStats();
  document.getElementById("topbar-percentage").textContent = `${stats.percentage}%`;
  document.getElementById("topbar-progress-fill").style.width = `${stats.percentage}%`;
}

// -------------------------------------------------------------
// RENDERERS FOR EACH PANEL
// -------------------------------------------------------------

// Render Home View
function renderHomeView() {
  const stats = getProgressStats();

  // Welcome Text
  const welcomeTitle = document.getElementById("welcome-title");
  if (stats.percentage === 100) {
    welcomeTitle.innerHTML = "Perfect Score! 🎉";
  } else {
    welcomeTitle.innerHTML = "Master Java 8 Streams";
  }

  // Summary Metrics
  document.getElementById("stats-percentage-text").textContent = `${stats.percentage}%`;
  document.getElementById("stats-circle-percentage").textContent = `${stats.percentage}%`;
  document.getElementById("stats-solved-count").textContent = `${stats.solved}/${stats.total}`;
  document.getElementById("stats-favorites-count").textContent = state.favorites.length;
  document.getElementById("stats-left-count").textContent = stats.total - stats.solved;

  // Circle animation offset calculation (circumference is 2 * PI * r = 2 * 3.14159 * 60 = ~377)
  const offset = 377 - (377 * stats.percentage) / 100;
  document.getElementById("stats-circle-progress").style.strokeDashoffset = offset;

  // Render Recently Viewed lists
  const recentContainer = document.getElementById("home-recent-list");
  recentContainer.innerHTML = "";
  if (state.recent.length === 0) {
    recentContainer.innerHTML = `<li class="item-list-empty">No questions recently viewed.</li>`;
  } else {
    state.recent.forEach(id => {
      const q = questions.find(item => item.id === id);
      if (q) {
        const li = document.createElement("li");
        li.className = "mini-item-link";
        li.innerHTML = `
          <span class="mini-item-title">${q.id}. ${q.title}</span>
          <span class="mini-item-difficulty ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
        `;
        li.addEventListener("click", () => {
          state.currentId = q.id;
          saveState();
          switchToView("practice");
        });
        recentContainer.appendChild(li);
      }
    });
  }

  // Render Favorites list
  const favContainer = document.getElementById("home-favorite-list");
  favContainer.innerHTML = "";
  if (state.favorites.length === 0) {
    favContainer.innerHTML = `<li class="item-list-empty">No favorite questions added.</li>`;
  } else {
    state.favorites.forEach(id => {
      const q = questions.find(item => item.id === id);
      if (q) {
        const li = document.createElement("li");
        li.className = "mini-item-link";
        li.innerHTML = `
          <span class="mini-item-title">${q.id}. ${q.title}</span>
          <span class="mini-item-difficulty ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
        `;
        li.addEventListener("click", () => {
          state.currentId = q.id;
          saveState();
          switchToView("practice");
        });
        favContainer.appendChild(li);
      }
    });
  }

  // Render Categories Dashboard Cards with Item Counts and Performance
  const categoryGrid = document.getElementById("home-categories-grid");
  categoryGrid.innerHTML = "";

  const categoriesList = ["Streams", "Collectors", "Arrays", "Strings", "Numbers", "Sorting", "Miscellaneous"];

  // Categorized Icons Mapping
  const icons = {
    Streams: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    Collectors: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    Arrays: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>`,
    Strings: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`,
    Numbers: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/><line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/></svg>`,
    Sorting: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="11" y1="5" x2="21" y2="5"/><line x1="11" y1="9" x2="21" y2="9"/><line x1="11" y1="13" x2="21" y2="13"/><line x1="11" y1="17" x2="21" y2="17"/><rect x="3" y="5" width="4" height="4"/><rect x="3" y="13" width="4" height="4"/></svg>`,
    Miscellaneous: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  categoriesList.forEach(cat => {
    const catQs = questions.filter(q => q.category === cat);
    const catSolved = catQs.filter(q => state.solved.includes(q.id));

    const div = document.createElement("div");
    div.className = "category-card";
    div.innerHTML = `
      <div class="category-icon">${icons[cat] || icons.Miscellaneous}</div>
      <div class="category-name">${cat}</div>
      <div class="category-count">${catSolved.length} / ${catQs.length} Mastered</div>
    `;
    div.addEventListener("click", () => {
      state.filterCategory = cat;
      switchToView("all-questions");
      // Activate respective filter pill visually
      document.querySelectorAll("#category-filter-pills .filter-pill").forEach(pill => {
        if (pill.getAttribute("data-category") === cat) {
          pill.classList.add("active");
        } else {
          pill.classList.remove("active");
        }
      });
    });
    categoryGrid.appendChild(div);
  });
}

// Render All Questions Table with Filters and Instant Search
function renderAllQuestionsTable() {
  const tableBody = document.getElementById("questions-table-body");
  tableBody.innerHTML = "";

  // Apply Search and Filters
  const filtered = questions.filter(q => {
    // Search Query (Match title or category)
    const matchesSearch = q.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(state.searchQuery.toLowerCase());

    // Category Filter
    const matchesCategory = state.filterCategory === "all" || q.category === state.filterCategory;

    // Difficulty Filter
    const matchesDifficulty = !state.filterDifficulty || q.difficulty.toLowerCase() === state.filterDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="table-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <h3>No questions found</h3>
            <p>Try resetting filters or adjusting search words.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(q => {
    const isSolved = state.solved.includes(q.id);
    const isFavorite = state.favorites.includes(q.id);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="td-status">
        ${isSolved
        ? `<i class="solved"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></i>`
        : `<i class="unsolved"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg></i>`}
      </td>
      <td class="td-id">${q.id}</td>
      <td class="td-title" id="title-lnk-${q.id}">${q.title}</td>
      <td class="td-category">${q.category}</td>
      <td>
        <span class="badge-difficulty ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
      </td>
      <td class="td-actions">
        <!-- Favorite Star -->
        <button class="btn-icon-action star ${isFavorite ? 'active' : ''}" id="fav-btn-${q.id}" title="${isFavorite ? 'Remove Favorite' : 'Mark Favorite'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
        <!-- Practice btn -->
        <button class="btn-table-practice" id="prac-btn-${q.id}">Practice</button>
      </td>
    `;

    // Click handlers for dynamically generated items
    tr.querySelector(`#title-lnk-${q.id}`).addEventListener("click", () => {
      state.currentId = q.id;
      saveState();
      switchToView("practice");
    });

    tr.querySelector(`#prac-btn-${q.id}`).addEventListener("click", () => {
      state.currentId = q.id;
      saveState();
      switchToView("practice");
    });

    tr.querySelector(`#fav-btn-${q.id}`).addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(q.id);
      renderAllQuestionsTable();
    });

    tableBody.appendChild(tr);
  });
}

// Render Question Detail Practice Mode Panel
function renderPracticeQuestion() {
  const q = questions.find(item => item.id === state.currentId);
  if (!q) return;

  // Add this question to Recently Viewed list
  addToRecentlyViewed(q.id);

  // Setup header badges & title
  document.getElementById("practice-q-number").textContent = `Question ${q.id} of ${questions.length}`;
  document.getElementById("practice-q-title").textContent = q.title;

  const diffBadge = document.getElementById("practice-q-difficulty");
  diffBadge.textContent = q.difficulty;
  diffBadge.className = `badge-difficulty ${q.difficulty.toLowerCase()}`;

  const catBadge = document.getElementById("practice-q-category");
  catBadge.textContent = q.category;

  // Set the sysout toggle checkbox value
  document.getElementById("practice-sysout-toggle").checked = state.includeSysout;

  // Favorite Star Toggle Display
  const isFav = state.favorites.includes(q.id);
  const favToggleBtn = document.getElementById("practice-favorite-toggle");
  favToggleBtn.classList.toggle("active", isFav);
  favToggleBtn.querySelector("svg").setAttribute("fill", isFav ? "currentColor" : "none");

  // Reset tab selection to Sample Input
  document.getElementById("btn-info-input").classList.add("active");
  document.getElementById("btn-info-output").classList.remove("active");
  document.getElementById("practice-input-wrapper").style.display = "block";
  document.getElementById("practice-output-wrapper").style.display = "none";

  // Show and highlight sample input/setup code
  const inputBlock = document.getElementById("practice-question-input");
  if (inputBlock) {
    inputBlock.innerHTML = highlightJavaCode(q.input || "");
  }

  // Render and highlight expected output code
  const outputBlock = document.getElementById("practice-question-output");
  if (outputBlock) {
    outputBlock.textContent = q.expectedOutput || "// No expected output specified";
  }

  // Load interactive compiler widget
  loadCompilerWidget(
    "compiler-widget-container",
    "practice-compiler-widget",
    q.id,
    q.input,
    q.expectedOutput
  );

  // Hide Java Code block initially
  const drawer = document.getElementById("practice-solution-drawer");
  const toggleBtn = document.getElementById("practice-toggle-solution");
  const toggleText = document.getElementById("solution-toggle-text");

  drawer.classList.remove("open");
  drawer.style.maxHeight = null;
  toggleBtn.classList.remove("showing");
  toggleText.textContent = "Show Solution";

  // Setup formatted code inside hidden box
  const codeBlock = document.getElementById("practice-solution-code");
  codeBlock.innerHTML = highlightJavaCode(q.solution);

  // Solved Status display updates
  const isSolved = state.solved.includes(q.id);
  const solvedText = document.getElementById("practice-mark-solved-text");
  const solvedBtn = document.getElementById("practice-mark-solved-btn");

  if (isSolved) {
    solvedText.textContent = "Solved";
    solvedBtn.style.backgroundColor = "var(--accent-success)";
    solvedBtn.querySelector("svg").style.display = "inline-block";
  } else {
    solvedText.textContent = "Mark as Solved";
    // Reset to default button styling
    solvedBtn.style.backgroundColor = "";
    solvedBtn.querySelector("svg").style.display = "inline-block";
  }

  // Navigation disable checks
  document.getElementById("practice-prev-btn").disabled = (q.id === 1);
  document.getElementById("practice-next-btn").disabled = (q.id === questions.length);
}

// Render Solved List View
function renderSolvedListView() {
  const container = document.getElementById("solved-questions-list");
  container.innerHTML = "";

  const solvedQs = questions.filter(q => state.solved.includes(q.id));

  // Update Solved stats overview boxes
  document.getElementById("solved-stats-count").textContent = `${solvedQs.length} / ${questions.length}`;

  const easySolvedCount = solvedQs.filter(q => q.difficulty === "Easy").length;
  const mediumSolvedCount = solvedQs.filter(q => q.difficulty === "Medium").length;
  document.getElementById("solved-stats-easy").textContent = easySolvedCount;
  document.getElementById("solved-stats-medium").textContent = mediumSolvedCount;

  if (solvedQs.length === 0) {
    container.innerHTML = `
      <div class="table-empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <h3>No Solved Questions</h3>
        <p>Your solved problems list is empty. Go practice and mark them complete!</p>
      </div>
    `;
    return;
  }

  solvedQs.forEach(q => {
    const card = document.createElement("div");
    card.className = "solved-item-card";
    card.innerHTML = `
      <div class="solved-item-left">
        <span class="solved-check-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
        <div class="solved-item-details">
          <span class="solved-item-title" id="solved-title-${q.id}">${q.id}. ${q.title}</span>
          <div class="solved-item-meta">
            <span class="solved-item-category">${q.category}</span>
            <span class="badge-difficulty ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
          </div>
        </div>
      </div>
      <button class="btn-remove-solved" id="unsolve-btn-${q.id}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <span>Unsolve</span>
      </button>
    `;

    // Click event to practice this question
    card.querySelector(`#solved-title-${q.id}`).addEventListener("click", () => {
      state.currentId = q.id;
      saveState();
      switchToView("practice");
    });

    // Unsolve button trigger
    card.querySelector(`#unsolve-btn-${q.id}`).addEventListener("click", () => {
      toggleSolved(q.id);
      renderSolvedListView();
      showToast(`Removed "${q.title}" from solved list.`);
    });

    container.appendChild(card);
  });
}

// Render Progress / Analytics View Page
function renderProgressDashboard() {
  const container = document.getElementById("progress-categories-list");
  container.innerHTML = "";

  const categoriesList = ["Streams", "Collectors", "Arrays", "Strings", "Numbers", "Sorting", "Miscellaneous"];

  categoriesList.forEach(cat => {
    const catQs = questions.filter(q => q.category === cat);
    const catSolved = catQs.filter(q => state.solved.includes(q.id));
    const percent = catQs.length > 0 ? Math.round((catSolved.length / catQs.length) * 100) : 0;

    const row = document.createElement("div");
    row.className = "progress-category-row";
    row.innerHTML = `
      <div class="progress-category-meta">
        <span>${cat}</span>
        <span>${catSolved.length} / ${catQs.length} (${percent}%)</span>
      </div>
      <div class="progress-category-bar-bg">
        <div class="progress-category-bar-fill" style="width: ${percent}%;"></div>
      </div>
    `;
    container.appendChild(row);
  });

  // Calculate difficulty ratios
  const easyTotal = questions.filter(q => q.difficulty === "Easy").length;
  const easySolved = questions.filter(q => q.difficulty === "Easy" && state.solved.includes(q.id)).length;
  const easyPercent = easyTotal > 0 ? Math.round((easySolved / easyTotal) * 100) : 0;
  document.getElementById("progress-easy-ratio").textContent = `${easySolved} / ${easyTotal} (${easyPercent}%)`;

  const mediumTotal = questions.filter(q => q.difficulty === "Medium").length;
  const mediumSolved = questions.filter(q => q.difficulty === "Medium" && state.solved.includes(q.id)).length;
  const mediumPercent = mediumTotal > 0 ? Math.round((mediumSolved / mediumTotal) * 100) : 0;
  document.getElementById("progress-medium-ratio").textContent = `${mediumSolved} / ${mediumTotal} (${mediumPercent}%)`;
}

// -------------------------------------------------------------
// EVENT ACTIONS & UTILITIES
// -------------------------------------------------------------

// Toggle Favorite Status
function toggleFavorite(id) {
  const idx = state.favorites.indexOf(id);
  if (idx > -1) {
    state.favorites.splice(idx, 1);
    showToast("Removed from favorites.");
  } else {
    state.favorites.push(id);
    showToast("Added to favorites!", "success");
  }
  saveState();
  // Update views
  updateGlobalProgress();
}

// Toggle Solved Status
function toggleSolved(id) {
  const idx = state.solved.indexOf(id);
  if (idx > -1) {
    state.solved.splice(idx, 1);
  } else {
    state.solved.push(id);
    // If all 26 are solved, trigger the confetti!
    if (state.solved.length === questions.length) {
      showToast("Incredible! You solved every single question! 🎉", "success");
      startConfetti();
    } else {
      showToast("Question completed!", "success");
    }
  }
  saveState();
  updateGlobalProgress();
}

// Get Random Unsolved or Alternate Question (Ensuring no immediate repeat if possible)
function getRandomQuestionId() {
  if (questions.length <= 1) return 1;

  // Filter out the current active ID
  const options = questions.filter(q => q.id !== state.currentId);

  // Prefer unsolved questions if possible
  const unsolvedOptions = options.filter(q => !state.solved.includes(q.id));
  const pool = unsolvedOptions.length > 0 ? unsolvedOptions : options;

  const randomIdx = Math.floor(Math.random() * pool.length);
  return pool[randomIdx].id;
}

// -------------------------------------------------------------
// USER INPUT & INTERACTION HANDLERS
// -------------------------------------------------------------

// Attach UI Event Listeners
function setupEventListeners() {

  // Sidebar view links
  document.querySelectorAll(".sidebar-item-link").forEach(link => {
    link.addEventListener("click", () => {
      switchToView(link.getAttribute("data-view"));
    });
  });

  // Home Screen Start Practicing buttons
  document.getElementById("home-start-btn").addEventListener("click", () => {
    switchToView("practice");
  });

  // Top Bar global progress trigger
  document.getElementById("topbar-progress-trigger").addEventListener("click", () => {
    switchToView("progress");
  });

  // Light/Dark Toggle click
  document.getElementById("theme-toggle").addEventListener("click", () => {
    // Save draft before re-rendering
    saveActiveWidgetDraft();
    
    state.theme = state.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", state.theme);
    saveState();

    // Re-render active widget to apply theme immediately
    if (document.getElementById("view-practice").classList.contains("active")) {
      renderPracticeQuestion();
    }
    if (state.studyActiveStep && document.getElementById("view-study-session").classList.contains("active")) {
      renderStudySession();
    }
  });

  // Search input events
  const searchInput = document.getElementById("global-search");
  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    // Switch to list view to display matches immediately
    switchToView("all-questions");
    renderAllQuestionsTable();
  });

  // Category filters pills trigger in list page
  document.querySelectorAll("#category-filter-pills .filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll("#category-filter-pills .filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");

      state.filterCategory = pill.getAttribute("data-category");
      renderAllQuestionsTable();
    });
  });

  // Easy / Medium filter buttons trigger in list page
  const easyBtn = document.getElementById("filter-easy");
  const medBtn = document.getElementById("filter-medium");

  easyBtn.addEventListener("click", () => {
    if (state.filterDifficulty === "easy") {
      state.filterDifficulty = null;
      easyBtn.classList.remove("active-easy");
    } else {
      state.filterDifficulty = "easy";
      easyBtn.classList.add("active-easy");
      medBtn.classList.remove("active-medium");
    }
    renderAllQuestionsTable();
  });

  medBtn.addEventListener("click", () => {
    if (state.filterDifficulty === "medium") {
      state.filterDifficulty = null;
      medBtn.classList.remove("active-medium");
    } else {
      state.filterDifficulty = "medium";
      medBtn.classList.add("active-medium");
      easyBtn.classList.remove("active-easy");
    }
    renderAllQuestionsTable();
  });

  // -------------------------------------------------------------
  // PRACTICE PANEL CONTROLS
  // -------------------------------------------------------------

  // Prev / Next Question Actions
  document.getElementById("practice-prev-btn").addEventListener("click", () => {
    if (state.currentId > 1) {
      saveActiveWidgetDraft();
      state.currentId--;
      saveState();
      renderPracticeQuestion();
    }
  });

  document.getElementById("practice-next-btn").addEventListener("click", () => {
    if (state.currentId < questions.length) {
      saveActiveWidgetDraft();
      state.currentId++;
      saveState();
      renderPracticeQuestion();
    }
  });

  // Random practice btn
  document.getElementById("practice-random-btn").addEventListener("click", () => {
    saveActiveWidgetDraft();
    state.currentId = getRandomQuestionId();
    saveState();
    renderPracticeQuestion();
  });

  // Copy title button (copies commented question name, optional sysout, and input setup code)
  document.getElementById("practice-copy-title").addEventListener("click", () => {
    const q = questions.find(item => item.id === state.currentId);
    if (q) {
      let copyText = `// Question ${q.id}: ${q.title}\n`;
      if (state.includeSysout) {
        copyText += `System.out.print("Question ${q.id}: ${q.title} : ");\n`;
      }
      copyText += q.input || "";
      navigator.clipboard.writeText(copyText)
        .then(() => showToast("Copied commented title and setup code!"))
        .catch(() => showToast("Failed to copy", "error"));
    }
  });

  // Print question button
  document.getElementById("practice-print-question").addEventListener("click", () => {
    // Open solution drawer before printing so it is fully visible on print page
    const drawer = document.getElementById("practice-solution-drawer");
    const toggleBtn = document.getElementById("practice-toggle-solution");
    const toggleText = document.getElementById("solution-toggle-text");

    drawer.classList.add("open");
    drawer.style.maxHeight = "none";
    toggleBtn.classList.add("showing");
    toggleText.textContent = "Hide Solution";

    window.print();
  });

  // Favorite Star toggle inside practice view
  document.getElementById("practice-favorite-toggle").addEventListener("click", () => {
    toggleFavorite(state.currentId);
    renderPracticeQuestion();
  });

  // Sysout Toggle change listener
  document.getElementById("practice-sysout-toggle").addEventListener("change", (e) => {
    state.includeSysout = e.target.checked;
    saveState();
  });

  // Practice Mode draft auto-save is now handled inside loadCompilerWidget's event listener

  // Show/Hide Solution toggle drawer action
  const solDrawer = document.getElementById("practice-solution-drawer");
  const solToggle = document.getElementById("practice-toggle-solution");
  const solToggleText = document.getElementById("solution-toggle-text");

  solToggle.addEventListener("click", () => {
    const isOpen = solDrawer.classList.contains("open");
    if (isOpen) {
      solDrawer.classList.remove("open");
      solDrawer.style.maxHeight = null;
      solToggle.classList.remove("showing");
      solToggleText.textContent = "Show Solution";
    } else {
      solDrawer.classList.add("open");
      solDrawer.style.maxHeight = solDrawer.scrollHeight + "px";
      solToggle.classList.add("showing");
      solToggleText.textContent = "Hide Solution";
    }
  });

  // Copy Java Code solution
  document.getElementById("practice-copy-solution").addEventListener("click", () => {
    const q = questions.find(item => item.id === state.currentId);
    if (q) {
      navigator.clipboard.writeText(q.solution)
        .then(() => showToast("Copied code to clipboard!"))
        .catch(() => showToast("Failed to copy code", "error"));
    }
  });

  // Mark question solved button
  document.getElementById("practice-mark-solved-btn").addEventListener("click", () => {
    toggleSolved(state.currentId);
    renderPracticeQuestion();
  });

  // Reset progress button in practice view
  document.getElementById("practice-reset-progress-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all practice progress? This deletes your solved status, favorites, and editor drafts!")) {
      clearAllData();
    }
  });

  // -------------------------------------------------------------
  // SOLVED VIEW CONTROLS
  // -------------------------------------------------------------
  document.getElementById("solved-unsolve-all-btn").addEventListener("click", () => {
    if (state.solved.length === 0) return;
    if (confirm("Are you sure you want to unsolve all questions?")) {
      state.solved = [];
      saveState();
      renderSolvedListView();
      updateGlobalProgress();
      showToast("Cleared solved status on all questions.");
    }
  });

  // -------------------------------------------------------------
  // PROGRESS VIEW CONTROLS (IMPORT/EXPORT/CLEAR)
  // -------------------------------------------------------------

  // Export JSON backup file
  document.getElementById("progress-export-btn").addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({
        solved: state.solved,
        favorites: state.favorites,
        drafts: state.drafts
      }, null, 2)
    );
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "java8_practice_progress.json");
    dlAnchorElem.click();
    showToast("Progress exported successfully!");
  });

  // Import JSON backup file
  document.getElementById("import-progress-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const imported = JSON.parse(evt.target.result);

        // Validation check
        if (imported && (Array.isArray(imported.solved) || Array.isArray(imported.favorites) || typeof imported.drafts === "object")) {
          if (Array.isArray(imported.solved)) state.solved = imported.solved.filter(x => typeof x === "number");
          if (Array.isArray(imported.favorites)) state.favorites = imported.favorites.filter(x => typeof x === "number");
          if (imported.drafts && typeof imported.drafts === "object") state.drafts = imported.drafts;

          saveState();
          updateGlobalProgress();
          switchToView("progress");
          showToast("Progress successfully imported!", "success");
        } else {
          showToast("Invalid file format", "error");
        }
      } catch (err) {
        showToast("Error parsing file", "error");
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be uploaded again
    e.target.value = "";
  });

  // Clear all data settings button
  document.getElementById("progress-reset-all-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all data in storage? This deletes everything permanently.")) {
      clearAllData();
    }
  });

  // -------------------------------------------------------------
  // STUDY HUB EVENT LISTENERS
  // -------------------------------------------------------------
  
  // Study session search input
  document.getElementById("study-session-search").addEventListener("input", (e) => {
    state.studySearchQuery = e.target.value;
    state.studyActiveCardIdx = 0; // reset to first matching card
    renderStudySession();
  });

  // Toggle Flashcard / QA List view in study session
  document.getElementById("btn-session-toggle-flashcards").addEventListener("click", () => {
    state.studyViewMode = "flashcard";
    document.getElementById("btn-session-toggle-flashcards").classList.add("active");
    document.getElementById("btn-session-toggle-qalist").classList.remove("active");
    renderStudySession();
  });

  document.getElementById("btn-session-toggle-qalist").addEventListener("click", () => {
    state.studyViewMode = "qalist";
    document.getElementById("btn-session-toggle-qalist").classList.add("active");
    document.getElementById("btn-session-toggle-flashcards").classList.remove("active");
    renderStudySession();
  });

  // 3D Card Flip action
  const flipCard = document.getElementById("study-session-flip-card");
  flipCard.addEventListener("click", (e) => {
    // Don't flip card if clicking inside answer scroll (scrollbar, buttons)
    if (flipCard.classList.contains("flipped") && e.target.closest("#session-flashcard-answer-container")) {
      return;
    }
    flipCard.classList.toggle("flipped");
  });

  // Reveal study coding solution button (collapsible drawer)
  const studySolDrawer = document.getElementById("study-session-solution-drawer");
  const studySolToggle = document.getElementById("study-session-toggle-solution");
  const studySolToggleText = document.getElementById("study-session-toggle-text");

  studySolToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = studySolDrawer.classList.contains("open");
    if (isOpen) {
      studySolDrawer.classList.remove("open");
      studySolDrawer.style.maxHeight = null;
      studySolToggleText.textContent = "Show Solution";
    } else {
      studySolDrawer.classList.add("open");
      studySolDrawer.style.maxHeight = studySolDrawer.scrollHeight + "px";
      studySolToggleText.textContent = "Hide Solution";
    }
  });

  // Navigation Controls (Prev/Next card)
  document.getElementById("study-session-prev-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    if (state.studyActiveCardIdx > 0) {
      saveActiveWidgetDraft();
      state.studyActiveCardIdx--;
      renderStudySession();
    }
  });

  document.getElementById("study-session-next-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const items = getFilteredStudyItems();
    if (state.studyActiveCardIdx < items.length - 1) {
      saveActiveWidgetDraft();
      state.studyActiveCardIdx++;
      renderStudySession();
    }
  });

  // Mark as Mastered button inside study session
  document.getElementById("study-session-mastered-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const items = getFilteredStudyItems();
    const currentIdx = state.studyActiveCardIdx;
    if (items.length > 0 && currentIdx < items.length) {
      const item = items[currentIdx];
      const step = state.studyActiveStep;
      const originalIndex = step.items.indexOf(item);
      
      if (!state.studyMastered[step.rel_path]) {
        state.studyMastered[step.rel_path] = [];
      }
      
      const masteredIdx = state.studyMastered[step.rel_path].indexOf(originalIndex);
      if (masteredIdx > -1) {
        state.studyMastered[step.rel_path].splice(masteredIdx, 1);
        showToast("Marked question as incomplete.");
      } else {
        state.studyMastered[step.rel_path].push(originalIndex);
        showToast("Marked question as mastered!", "success");
      }
      saveState();
      renderStudySession();
      renderStudyHub();
    }
  });

  // Study Session Back Button
  document.getElementById("study-session-back-btn").addEventListener("click", () => {
    state.studyActiveStep = null;
    saveState();
    switchToView("study-hub");
  });

  // Study Mode draft auto-save is now handled inside loadCompilerWidget's event listener

  // Practice Mode Tabs Event Listeners
  document.getElementById("btn-info-input").addEventListener("click", () => {
    document.getElementById("btn-info-input").classList.add("active");
    document.getElementById("btn-info-output").classList.remove("active");
    document.getElementById("practice-input-wrapper").style.display = "block";
    document.getElementById("practice-output-wrapper").style.display = "none";
  });

  document.getElementById("btn-info-output").addEventListener("click", () => {
    document.getElementById("btn-info-output").classList.add("active");
    document.getElementById("btn-info-input").classList.remove("active");
    document.getElementById("practice-input-wrapper").style.display = "none";
    document.getElementById("practice-output-wrapper").style.display = "block";
  });

  // Study Session Coding Workspace Tabs Event Listeners
  document.getElementById("btn-study-info-input").addEventListener("click", () => {
    document.getElementById("btn-study-info-input").classList.add("active");
    document.getElementById("btn-study-info-output").classList.remove("active");
    document.getElementById("study-input-wrapper").style.display = "block";
    document.getElementById("study-output-wrapper").style.display = "none";
  });

  document.getElementById("btn-study-info-output").addEventListener("click", () => {
    document.getElementById("btn-study-info-output").classList.add("active");
    document.getElementById("btn-study-info-input").classList.remove("active");
    document.getElementById("study-input-wrapper").style.display = "none";
    document.getElementById("study-output-wrapper").style.display = "block";
  });
}

// Full Clear State Utility
function clearAllData() {
  localStorage.clear();
  state.solved = [];
  state.favorites = [];
  state.recent = [];
  state.currentId = 1;
  state.drafts = {};
  state.theme = "dark";
  state.studyMastered = {};
  state.studyActiveModule = "m1";

  document.documentElement.setAttribute("data-theme", "dark");
  saveState();
  updateGlobalProgress();
  switchToView("home");
  showToast("All progress and data reset successfully.", "success");
}

// -------------------------------------------------------------
// KEYBOARD SHORTCUTS CONTROLLER
// -------------------------------------------------------------
function handleKeyboardShortcuts(e) {
  // If user is focused on input/textarea, bypass shortcut triggers
  const targetTag = document.activeElement.tagName;
  if (targetTag === "TEXTAREA" || targetTag === "INPUT") {
    return;
  }

  const key = e.key.toLowerCase();

  if (e.key === "ArrowRight") {
    // Next Question
    if (state.currentId < questions.length) {
      saveActiveWidgetDraft();
      state.currentId++;
      saveState();
      if (document.getElementById("view-practice").classList.contains("active")) {
        renderPracticeQuestion();
      } else {
        switchToView("practice");
      }
      showToast(`Navigated to Question ${state.currentId}`);
    }
  } else if (e.key === "ArrowLeft") {
    // Previous Question
    if (state.currentId > 1) {
      saveActiveWidgetDraft();
      state.currentId--;
      saveState();
      if (document.getElementById("view-practice").classList.contains("active")) {
        renderPracticeQuestion();
      } else {
        switchToView("practice");
      }
      showToast(`Navigated to Question ${state.currentId}`);
    }
  } else if (key === "r") {
    // Random Question
    saveActiveWidgetDraft();
    state.currentId = getRandomQuestionId();
    saveState();
    if (document.getElementById("view-practice").classList.contains("active")) {
      renderPracticeQuestion();
    } else {
      switchToView("practice");
    }
    showToast(`Loading Random Question ${state.currentId}`);
  } else if (key === "s") {
    // Toggle Solution
    if (document.getElementById("view-practice").classList.contains("active")) {
      const solToggle = document.getElementById("practice-toggle-solution");
      if (solToggle) solToggle.click();
    } else {
      switchToView("practice");
      setTimeout(() => {
        const solToggle = document.getElementById("practice-toggle-solution");
        if (solToggle) solToggle.click();
      }, 100);
    }
  } else if (key === "f") {
    // Focus search input
    e.preventDefault();
    const searchInput = document.getElementById("global-search");
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
}

// ==========================================================================
// STUDY HUB ACTIONS & RENDERING
// ==========================================================================

function toggleReferenceDone(step) {
  if (!state.studyMastered[step.rel_path]) {
    state.studyMastered[step.rel_path] = [];
  }
  const idx = state.studyMastered[step.rel_path].indexOf(0);
  if (idx > -1) {
    state.studyMastered[step.rel_path].splice(idx, 1);
    showToast("Marked topic as incomplete.");
  } else {
    state.studyMastered[step.rel_path].push(0);
    showToast("Marked topic as read/done!", "success");
  }
  saveState();
}

function renderStudyHub() {
  const studyTabsContainer = document.getElementById("study-module-tabs");
  if (!studyTabsContainer) return;
  studyTabsContainer.innerHTML = "";

  Object.keys(materialsData).forEach(mId => {
    const mod = materialsData[mId];
    const button = document.createElement("button");
    button.className = `study-tab ${state.studyActiveModule === mId ? "active" : ""}`;
    button.textContent = mod.name;
    button.addEventListener("click", () => {
      state.studyActiveModule = mId;
      saveState();
      renderStudyHub();
    });
    studyTabsContainer.appendChild(button);
  });

  const activeMod = materialsData[state.studyActiveModule];
  const totalSteps = activeMod.steps.length;
  let completedSteps = 0;
  let totalItemsCount = 0;
  let totalMasteredCount = 0;

  activeMod.steps.forEach(step => {
    const mastered = state.studyMastered[step.rel_path] || [];
    if (step.type === "qa" || step.type === "coding") {
      totalItemsCount += step.items.length;
      totalMasteredCount += mastered.length;
      if (step.items.length > 0 && mastered.length === step.items.length) {
        completedSteps++;
      }
    } else {
      if (mastered.includes(0)) {
        completedSteps++;
        totalMasteredCount += 1;
      }
      totalItemsCount += 1;
    }
  });

  const overallPercentage = totalItemsCount > 0 ? Math.round((totalMasteredCount / totalItemsCount) * 100) : 0;
  
  document.getElementById("study-total-steps").textContent = totalSteps;
  document.getElementById("study-completed-steps").textContent = `${completedSteps} / ${totalSteps}`;
  document.getElementById("study-module-percentage").textContent = `${overallPercentage}%`;
  document.getElementById("study-module-progress-fill").style.width = `${overallPercentage}%`;

  const stepsContainer = document.getElementById("roadmap-steps-container");
  stepsContainer.innerHTML = "";

  if (activeMod.steps.length === 0) {
    stepsContainer.innerHTML = `<div class="item-list-empty">No topics available in this module.</div>`;
    return;
  }

  activeMod.steps.forEach((step, idx) => {
    const mastered = state.studyMastered[step.rel_path] || [];
    let stepPercent = 0;
    let progressText = "";
    
    if (step.type === "qa" || step.type === "coding") {
      const total = step.items.length;
      stepPercent = total > 0 ? Math.round((mastered.length / total) * 100) : 0;
      progressText = `${mastered.length} / ${total} Mastered`;
    } else {
      const isDone = mastered.includes(0);
      stepPercent = isDone ? 100 : 0;
      progressText = isDone ? "Read & Done" : "Not Read";
    }

    const card = document.createElement("div");
    card.className = "card-premium step-card";
    
    let typeBadgeClass = step.type; // qa, coding, reference, resume
    let typeBadgeText = step.type === "qa" ? "Theory Q&A" : 
                        step.type === "coding" ? "Coding Challenge" : 
                        step.type === "reference" ? "Revision Notes" : "Resume Tips";

    card.innerHTML = `
      <div class="step-card-header">
        <div style="flex-grow: 1;">
          <span class="step-card-badge ${typeBadgeClass}">${typeBadgeText}</span>
          <h3 class="step-card-title" style="margin-top: 8px;">${step.title}</h3>
        </div>
      </div>
      
      <div class="step-card-meta">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
        <span>${step.pages} pages (${step.size_kb} KB)</span>
      </div>

      <div class="step-card-progress">
        <span>Progress: ${stepPercent}%</span>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${progressText}</span>
      </div>
      <div class="step-card-progress-bar-container">
        <div class="step-card-progress-bar-fill" style="width: ${stepPercent}%;"></div>
      </div>

      <div class="step-card-actions">
        ${(step.type === "qa" || step.type === "coding") 
          ? `<button class="btn-primary" id="study-btn-${idx}">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
               <span>Study Interactively</span>
             </button>` 
          : `<button class="btn-primary" id="mark-done-btn-${idx}">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
               <span>${stepPercent === 100 ? "Done" : "Mark as Done"}</span>
             </button>`
        }
        <a href="${step.rel_path}" target="_blank" class="btn-secondary" id="pdf-btn-${idx}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>View PDF</span>
        </a>
      </div>
    `;

    // Button handlers
    if (step.type === "qa" || step.type === "coding") {
      card.querySelector(`#study-btn-${idx}`).addEventListener("click", () => {
        openStudySession(step);
      });
    } else {
      card.querySelector(`#mark-done-btn-${idx}`).addEventListener("click", () => {
        toggleReferenceDone(step);
        renderStudyHub();
      });
    }

    stepsContainer.appendChild(card);
  });
}

function openStudySession(step) {
  state.studyActiveStep = step;
  state.studyActiveCardIdx = 0;
  state.studySearchQuery = "";
  state.studyViewMode = "flashcard";
  
  const searchInput = document.getElementById("study-session-search");
  if (searchInput) searchInput.value = "";
  
  document.getElementById("btn-session-toggle-flashcards").classList.add("active");
  document.getElementById("btn-session-toggle-qalist").classList.remove("active");
  
  switchToView("study-session");
}

function getFilteredStudyItems() {
  const step = state.studyActiveStep;
  if (!step || !step.items) return [];
  if (!state.studySearchQuery) return step.items;
  return step.items.filter(item => {
    const qText = (item.q || item.title || "").toLowerCase();
    const aText = (item.a || item.problem || item.solution || item.explanation || "").toLowerCase();
    const query = state.studySearchQuery.toLowerCase();
    return qText.includes(query) || aText.includes(query);
  });
}

function renderStudySession() {
  const step = state.studyActiveStep;
  if (!step) return;

  const items = getFilteredStudyItems();
  const total = items.length;
  
  // Clamping active card index
  if (state.studyActiveCardIdx >= total) {
    state.studyActiveCardIdx = Math.max(0, total - 1);
  }
  const currentIdx = state.studyActiveCardIdx;

  // Header step info
  document.getElementById("study-session-step-title").textContent = step.title;
  
  // Step tag/badge
  const stepTag = document.getElementById("study-session-step-tag");
  if (stepTag) {
    const activeMod = materialsData[state.studyActiveModule];
    const originalStepIdx = activeMod.steps.indexOf(step);
    stepTag.textContent = `Step ${originalStepIdx + 1}`;
  }
  
  // Progress Bar & Stats
  const progressText = total > 0 ? `${currentIdx + 1} / ${total}` : "0 / 0";
  const progressPercent = total > 0 ? ((currentIdx + 1) / total) * 100 : 0;
  document.getElementById("study-session-progress-text").textContent = progressText;
  document.getElementById("study-session-progress-fill").style.width = `${progressPercent}%`;

  if (state.studyViewMode === "flashcard") {
    document.getElementById("study-session-flashcard-view").style.display = "flex";
    document.getElementById("study-session-qalist-view").style.display = "none";
    
    // Always hide solution drawer by default in flashcard mode
    const studySolDrawer = document.getElementById("study-session-solution-drawer");
    if (studySolDrawer) {
      studySolDrawer.classList.remove("open");
      studySolDrawer.style.maxHeight = null;
      document.getElementById("study-session-toggle-text").textContent = "Show Solution";
    }

    if (total === 0) {
      document.getElementById("session-flashcard-question").textContent = "No questions found matching search criteria.";
      document.getElementById("session-flashcard-answer").textContent = "";
      document.getElementById("study-session-flip-card").style.display = "block";
      document.getElementById("study-session-coding-workspace").style.display = "none";
      document.getElementById("study-session-prev-btn").disabled = true;
      document.getElementById("study-session-next-btn").disabled = true;
      document.getElementById("study-session-mastered-btn").disabled = true;
      return;
    }

    document.getElementById("study-session-prev-btn").disabled = (currentIdx === 0);
    document.getElementById("study-session-next-btn").disabled = (currentIdx === total - 1);
    document.getElementById("study-session-mastered-btn").disabled = false;

    const item = items[currentIdx];
    const originalIndex = step.items.indexOf(item);
    
    if (step.type === "coding") {
      // Hide standard QA flip card
      document.getElementById("study-session-flip-card").style.display = "none";
      // Show split IDE workspace
      document.getElementById("study-session-coding-workspace").style.display = "block";
      
      // Populate fields
      document.getElementById("study-session-coding-title").textContent = item.title || "Coding Challenge";
      
      // Reset tab selection to Input Setup
      document.getElementById("btn-study-info-input").classList.add("active");
      document.getElementById("btn-study-info-output").classList.remove("active");
      document.getElementById("study-input-wrapper").style.display = "block";
      document.getElementById("study-output-wrapper").style.display = "none";

      // Setup inputs & expected output
      document.getElementById("study-session-coding-input").innerHTML = highlightJavaCode(item.problem || "");
      document.getElementById("study-session-coding-output").innerHTML = highlightJavaCode("// Expected Output:\n" + (item.expectedOutput || "// Refer to solution code for details."));
      
      // Setup explanation
      document.getElementById("study-session-code-explanation").textContent = item.explanation || "";
      
      // Setup solution
      document.getElementById("study-session-code-solution").innerHTML = highlightJavaCode(item.solution || "");
      
      // Restore draft code and load compiler widget
      const draftKey = `study_${step.rel_path}_${originalIndex}`;
      loadCompilerWidget(
        "study-compiler-widget-container",
        "study-session-compiler-widget",
        draftKey,
        item.problem
      );
    } else {
      // Show standard QA flip card
      document.getElementById("study-session-flip-card").style.display = "block";
      // Hide split IDE workspace
      document.getElementById("study-session-coding-workspace").style.display = "none";
      
      // Reset card flip to front side
      const flipCard = document.getElementById("study-session-flip-card");
      flipCard.classList.remove("flipped");

      // Front side (Question / Problem title)
      document.getElementById("session-flashcard-question").textContent = item.q || item.title || item.problem;

      // Back side (Answer / Explanation)
      document.getElementById("session-flashcard-answer").textContent = item.a || "";
    }

    // Mastered button styling
    const mastered = state.studyMastered[step.rel_path] || [];
    const isMastered = mastered.includes(originalIndex);
    const masteredBtn = document.getElementById("study-session-mastered-btn");
    const masteredText = document.getElementById("study-session-mastered-text");

    if (isMastered) {
      masteredText.textContent = "Mastered";
      masteredBtn.style.backgroundColor = "var(--accent-success)";
    } else {
      masteredText.textContent = "Mark as Mastered";
      masteredBtn.style.backgroundColor = "";
    }
  } else {
    // QA List View
    document.getElementById("study-session-flashcard-view").style.display = "none";
    const qalistContainer = document.getElementById("study-session-qalist-view");
    qalistContainer.style.display = "flex";
    qalistContainer.innerHTML = "";

    if (total === 0) {
      qalistContainer.innerHTML = `<div class="item-list-empty">No questions found matching search criteria.</div>`;
      return;
    }

    items.forEach(item => {
      const originalIndex = step.items.indexOf(item);
      const mastered = state.studyMastered[step.rel_path] || [];
      const isMastered = mastered.includes(originalIndex);
      
      const itemDiv = document.createElement("div");
      itemDiv.className = "qalist-item";
      itemDiv.id = `qalist-item-${originalIndex}`;
      itemDiv.innerHTML = `
        <div class="qalist-question-row" id="qalist-row-${originalIndex}">
          <div class="qalist-meta">
            ${isMastered ? '<span class="qalist-mastered-badge">Mastered</span>' : ''}
            <span>${item.q || item.title || item.problem}</span>
          </div>
          <svg class="qalist-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="qalist-answer-drawer" id="qalist-drawer-${originalIndex}">
          <div class="qalist-answer-content">
            <div style="white-space: pre-wrap; margin-bottom: 15px;">${item.a || item.problem || ''}</div>
            ${step.type === "coding" 
              ? `<div style="margin-top: 15px;">
                   <strong>Java 8 Solution:</strong>
                   <div class="code-block-container" style="margin-top: 8px;">
                     <pre class="solution-code-pre"><code class="java-code-block">${highlightJavaCode(item.solution || "")}</code></pre>
                   </div>
                   ${item.explanation ? `<div style="margin-top: 10px; color: var(--text-muted); font-size: 0.85rem;">${item.explanation}</div>` : ''}
                 </div>` 
              : ''
            }
            <button class="btn-secondary" style="margin-top: 15px; font-size: 0.8rem;" id="qalist-master-btn-${originalIndex}">
              ${isMastered ? 'Mark Incomplete' : 'Mark Mastered'}
            </button>
          </div>
        </div>
      `;

      // Accordion click handler
      itemDiv.querySelector(`#qalist-row-${originalIndex}`).addEventListener("click", () => {
        const isOpen = itemDiv.classList.contains("open");
        const drawer = itemDiv.querySelector(`#qalist-drawer-${originalIndex}`);
        
        // Close others
        document.querySelectorAll(".qalist-item").forEach(otherItem => {
          if (otherItem !== itemDiv && otherItem.classList.contains("open")) {
            otherItem.classList.remove("open");
            otherItem.querySelector(".qalist-answer-drawer").style.maxHeight = "0px";
          }
        });

        if (isOpen) {
          itemDiv.classList.remove("open");
          drawer.style.maxHeight = "0px";
        } else {
          itemDiv.classList.add("open");
          drawer.style.maxHeight = drawer.scrollHeight + "px";
        }
      });

      // Mastered toggle handler
      itemDiv.querySelector(`#qalist-master-btn-${originalIndex}`).addEventListener("click", (e) => {
        e.stopPropagation();
        if (!state.studyMastered[step.rel_path]) {
          state.studyMastered[step.rel_path] = [];
        }
        const mIdx = state.studyMastered[step.rel_path].indexOf(originalIndex);
        if (mIdx > -1) {
          state.studyMastered[step.rel_path].splice(mIdx, 1);
          showToast("Marked question as incomplete.");
        } else {
          state.studyMastered[step.rel_path].push(originalIndex);
          showToast("Marked question as mastered!", "success");
        }
        saveState();
        renderStudySession();
        renderStudyHub();
      });

      qalistContainer.appendChild(itemDiv);
    });
  }
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  document.documentElement.setAttribute("data-theme", state.theme);
  updateGlobalProgress();
  setupEventListeners();

  // Bind Keyboard listener
  window.addEventListener("keydown", handleKeyboardShortcuts);

  // Set default view on page load
  switchToView("home");
});
