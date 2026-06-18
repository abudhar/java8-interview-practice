# Java 8 Interview Practice Website

A clean, responsive, offline practice environment to master Java 8 Stream API coding questions. Designed to work completely client-side in any modern browser without any external frameworks, databases, or online dependencies.

## Project Structure

```text
java8-interview-practice/
├── index.html       # Single-page UI with inline SVG assets & page shells
├── style.css        # Adaptive layout styling, themes, custom syntax themes & transitions
├── script.js        # Core controller handling page navigation, local storage state & canvas particles
├── questions.js     # Java 8 coding question source list containing 26 image questions
└── README.md        # This documentation
```

## Features

- **LeetCode Style UI**: A clean multi-tab layout consisting of:
  - **Home Dashboard**: Quick statistics, progress circle, categories breakdown, recently viewed items, and favorites.
  - **All Questions**: Complete search-enabled table listing titles, categories, difficulty, status, and custom tags.
  - **Practice Mode**: Rich sandbox with navigation controls, print options, a "Try Yourself First" coding editor, and a syntax-highlighted solutions panel.
  - **Solved Questions**: Filtered list of completed items to review your strengths.
  - **Progress Analytics**: In-depth progress stats segmented by Java category and difficulty level, with export and import backup tools.
- **Offline Syntax Highlighter**: Lightweight regex engine highlights chained stream APIs, collectors, variables, numbers, strings, and comments locally.
- **Local Storage State Persistence**: Saves dark mode settings, code drafts in the editor, favorites, recent questions, and solved checkmarks across page refreshes.
- **Offline Confetti**: A high-performance canvas engine triggers colored particles when completing all 26 questions.
- **Keyboard Shortcuts**: Practice questions smoothly without leaving your keyboard.
- **Responsive & Adaptable**: Moves sidebar navigation tabs to a bottom navigation bar on mobile interfaces for a native application feel.

## Keyboard Shortcuts

| Key | Description |
|---|---|
| `Right Arrow` | Navigate to Next Question in Practice Mode |
| `Left Arrow` | Navigate to Previous Question in Practice Mode |
| `R` / `r` | Load a Random unsolved Question |
| `S` / `s` | Toggle display of Java Solution |
| `F` / `f` | Highlight and focus the global search bar |

## Getting Started

1. Navigate to the `java8-interview-practice` directory.
2. Double-click `index.html` to launch the application instantly in your browser (no internet required).
