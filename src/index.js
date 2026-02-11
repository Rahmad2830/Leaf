const registry = {}
const instance = new WeakMap()
let schedule = false
const connectQueue = new Set()
const disconnectQueue = new Set()

export function defineScope(name, callback) {
  registry[name] = callback
}

function scheduleFlush() {
  if(schedule) return
  schedule = true
  
  queueMicrotask(() => {
    schedule = false
    disconnectQueue.forEach(node => {
      if (!node.isConnected) manageLifecycle(node, "disconnect")
    })
    connectQueue.forEach(node => {
      if (node.isConnected) manageLifecycle(node, "connect")
    })
    connectQueue.clear()
    disconnectQueue.clear()
  })
}

function createTargets(node) {
  const single = new Proxy({}, {
    get: (_, name) => {
      return node.querySelector(
        `[data-target="${String(name)}"]`
      )
    }
  })
  const multiple = new Proxy({}, {
    get: (_, name) => {
      return node.querySelectorAll(
        `[data-target="${String(name)}"]`
      )
    }
  })
  
  return new Proxy({}, {
    get: (_, name) => {
      if (name === "all") return multiple
      return single[name]
    }
  })
}

function manageLifecycle(node, actions) {
  const scopeName = node.dataset.scope
  const setup = registry[scopeName]
  if(!setup) {
    console.error(`Scope ${scopeName} not found`)
    return
  }
  
  let controller = instance.get(node)
  if(actions === "connect") {
    if(!controller) {
      controller = setup({
        root: node,
        targets: createTargets(node),
        values: new Proxy({}, {
          get: (_, name) => node.dataset[name],
          set: (_, name, value) => {
            node.dataset[name] = value
            return true
          }
        })
      })
      instance.set(node, controller)
      if(typeof controller.connect === "function") controller.connect()
    }
  } else if(actions === "disconnect" && controller) {
    if(typeof controller.disconnect === "function") {
      controller.disconnect()
    }
    instance.delete(node)
  }
}

const observer = new MutationObserver(entries => {
  entries.forEach(entry => {
    entry.addedNodes.forEach(node => {
      if(node.nodeType !== 1) return
      if(node.matches("[data-scope]")) connectQueue.add(node)
      node.querySelectorAll("[data-scope]").forEach(el => connectQueue.add(el))
    })
    entry.removedNodes.forEach(node => {
      if(node.nodeType !== 1) return
      if(node.matches("[data-scope]")) disconnectQueue.add(node)
      node.querySelectorAll("[data-scope]").forEach(el => disconnectQueue.add(el))
    })
  })
  
  scheduleFlush()
})

function init() {
  observer.observe(document.body, { childList: true, subtree: true })
  document.querySelectorAll("[data-scope]").forEach(el => manageLifecycle(el, "connect"))
  
  const Events = ["click", "submit", "input", "change", "focus", "blur", "keydown", "pointerdown"]
  Events.forEach(type => {
    document.addEventListener(type, (e) => {
      const el = e.target.closest(`[data-action*="${type}->"]`)
      if(!el) return
      
      const actions = el.dataset.action.split(/\s+/)
      const matchingActions = actions.filter(p => p.startsWith(`${type}->`))
      matchingActions.forEach(action => {
        const [_, method] = action.split("->").map(s => s.trim())
        const scopeEl = el.closest("[data-scope]")
        if(!scopeEl) return
        const scopeVal = scopeEl.dataset.scope
        if(!instance.has(scopeEl)) manageLifecycle(scopeEl, "connect")
        
        const ctx = { element: el, event: e,
          params: new Proxy({}, {
            get: (_, name) => el.dataset[name],
            set: (_, name, value) => {
              el.dataset[name] = value
              return true
            }
          })
        }
        const controller = instance.get(scopeEl)
        if(!controller[method]) console.warn(`scope:${scopeVal} method "${method}" not found`)
        try { controller[method](ctx) }
        catch (e) { console.error(`[scope:${scopeVal}] ${method}() failed`, e) }
      })
    }, { capture: true })
  })
}

function start() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    init()
  }
}

start()