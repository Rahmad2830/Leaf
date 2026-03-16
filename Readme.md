# Leaf.js

<div style="display: flex; justify-content: center;">
  <img src="assets/Leaf.webp" width="300" alt="Leaf-logo" style="display: block; margin: 0 auto;" />
</div>

![Build-Passing](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Dependency](https://img.shields.io/badge/Dependency_Count-0-brightgreen?style=for-the-badge)
![Size](https://img.shields.io/badge/Size-<1kb_Gzip-brightgreen?style=for-the-badge)

Leaf.js is a lightweight JavaScript library for building UI components directly in HTML using data attributes. It enables dynamic behavior through a simple scope-based architecture — no build tools, no bundler, no complex setup required.

**✨ Key Features**
- Scope-based component system
- DOM targeting via `data-target`
- Declarative event binding via `data-action`
- Reactive values through `data-*` attributes
- Lifecycle hooks (`connect` & `disconnect`)
- Auto DOM observation via `MutationObserver`
- Zero dependencies, extremely lightweight

**🚀 Quickstart**

### HTML
```html
<div data-scope="greet">
  <label for="name">Name</label>
  <input data-target="input" type="text" id="name" />
  <button data-action="click->hello">Greet</button>
  
  <p data-target="output"></p>
</div>
```

### Javascript
```js
import { defineScope } from "https://cdn.jsdelivr.net/gh/Rahmad2830/Leaf@v1.0.1/dist/Leaf.min.js"

defineScope("greet", ({ targets }) => {
  const output = targets.output
  const input = targets.input
  
  function hello() {
    output.textContent = input.value
  }
  
  return { hello }
})
```

**📦 Installation**

Simply import Leaf.js into your project via cdn

```JavaScript
import { defineScope } from "https://cdn.jsdelivr.net/gh/Rahmad2830/Leaf@v1.0.1/dist/Leaf.min.js"

defineScope("anyScope", () => {
  //code goes here
})
```

**📚 Documentation**

For full guides, examples, and API reference, visit the official documentation:

👉 https://withcable.web.id

**☕ Buy me a Coffee**

I really appreciate your support. Thank you.

<a href="https://ko-fi.com/rahmatnurhidayat">
  <img src="assets/support_me_on_kofi_beige.png" width="250" alt="Support-me" />
</a>
