# Contributing to Leaf

Thank you for your interest in contributing to Leaf! This document outlines the guidelines and workflow for contributing to the project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Core Concepts](#core-concepts)
- [Development Workflow](#development-workflow)
- [Submitting Changes](#submitting-changes)
- [Coding Style](#coding-style)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

By participating in this project, you are expected to be respectful and constructive. Harassment, discrimination, or any form of hostile behavior will not be tolerated.

---

## Getting Started

### Prerequisites

- A modern browser or Node.js environment for testing
- Basic familiarity with the DOM, MutationObserver, and ES Modules

### Setup

```bash
# Clone the repository
git clone https://github.com/Rahmad2830/Leaf.git
cd Leaf

# No build step required — Leaf is a single, dependency-free file
```

Open any `.html` file that imports `Leaf` directly in your browser to test changes. There is no compilation or bundling required.

---

## Project Structure

```
Leaf          # The entire library — a single ES module file
README.md        # Usage documentation
CONTRIBUTING.md  # This file
examples/        # Example HTML files demonstrating usage
tests/           # Test cases (if applicable)
```

Leaf is intentionally kept as a **single file with zero dependencies**. Please do not introduce external packages or a build pipeline unless there is a compelling, discussed reason to do so.

---

## Core Concepts

Understanding these internal pieces will help you contribute effectively.

### Registry

```js
const registry = {}
```

Stores scope definitions by name. When `defineScope(name, callback)` is called, the callback is stored here and later invoked when a matching `[data-scope]` element is connected.

### Instance Map

```js
const instance = new WeakMap()
```

Maps each live DOM node to its controller object. Using a `WeakMap` ensures controllers are garbage-collected when their nodes are removed from the DOM.

### Lifecycle (`manageLifecycle`)

Handles `"connect"` and `"disconnect"` actions for a `[data-scope]` node:

- **connect** — Calls the registered scope callback with `{ root, targets, values }`, stores the returned controller, then calls `controller.connect()` if it exists.
- **disconnect** — Calls `controller.disconnect()` if it exists, then removes the instance from the map.

### Targets (`createTargets`)

Provides scoped DOM queries via `targets.myTarget` (single) and `targets.all.myTarget` (multiple), resolved lazily using `Proxy`.

### Action Delegation

A small set of events (`click`, `submit`, `input`, etc.) are delegated at the document level. When an event fires on an element with `data-action="eventType->methodName"`, Leaf finds the nearest `[data-scope]` ancestor and calls the matching method on its controller.

### MutationObserver + Flush Queue

DOM mutations are batched using `connectQueue` and `disconnectQueue`, and flushed in a `queueMicrotask` to avoid redundant lifecycle calls when nodes are rapidly added and removed.

---

## Development Workflow

### Making Changes

1. Fork the repository and create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes directly in `Leaf`.

3. Test your changes manually in a browser using the files in `examples/`, or write a new example if your change introduces new behavior.

4. If tests exist, make sure they pass before submitting.

### Areas Open for Contribution

- **Bug fixes** — Check the issue tracker for confirmed bugs.
- **New delegated event types** — Additions to the `Events` array should be justified and cover a real use case.
- **Lifecycle improvements** — Changes to `manageLifecycle` or the flush queue must preserve correctness under rapid DOM mutations.
- **Documentation** — Improvements to README, examples, and inline comments are always welcome.
- **Performance** — Optimizations that do not change public-facing behavior are welcome.

### What to Avoid

- Do not add external dependencies.
- Do not split the library into multiple files without prior discussion.
- Do not change the public API (`defineScope`, `data-scope`, `data-action`, `data-target`, `data-*` values interface) in a breaking way without an open issue and consensus.

---

## Submitting Changes

1. Ensure your branch is up to date with `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. Open a pull request with:
   - A clear title summarizing the change
   - A description of **what** changed and **why**
   - A reference to any related issue (e.g., `Closes #42`)
   - A brief note on how you tested the change

3. Be responsive to feedback. PRs that go stale without response may be closed.

---

## Coding Style

Leaf follows a minimal, readable style. Please match the conventions already present in the file:

- Use `const` and `let` — never `var`
- Prefer concise arrow functions for callbacks
- Avoid unnecessary abstractions — the code should be readable by someone unfamiliar with the project
- Keep error messages consistent with the existing format:
  - `console.error(...)` for missing scope registrations or missing return values
  - `console.warn(...)` for missing action methods
  - Include the scope name in error messages where relevant (e.g., `[scope:myScope]`)
- Do not add comments that merely restate what the code does — only comment on **why** something non-obvious is done

---

## Reporting Bugs

Before opening a bug report, please:

1. Confirm the issue is reproducible with the latest version of `Leaf`
2. Check that an existing issue doesn't already cover it

When filing a bug, include:

- A minimal HTML snippet that reproduces the problem
- The browser and version you're using
- A description of what you expected to happen vs. what actually happened

---

## Suggesting Features

Open an issue with the `enhancement` label. Describe:

- The problem you're trying to solve
- Your proposed API or behavior change
- Any alternative approaches you considered

Feature requests that align with Leaf's philosophy — **small surface area, zero dependencies, DOM-first** — are most likely to be accepted.

---

## Questions?

If you're unsure whether something is a bug or a feature, or you'd like feedback on an idea before investing time in a PR, feel free to open a discussion or a draft pull request.