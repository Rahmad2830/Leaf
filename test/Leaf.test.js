import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineScope } from '../dist/Leaf.min.js'

describe('Leaf Framework Unit Test', () => {
  
  // Helper untuk membersihkan DOM dan memicu init
  beforeEach(() => {
    document.body.innerHTML = ''
    
    // Karena file .min.js menggunakan DOMContentLoaded, 
    // kita trigger manual agar init() berjalan di environment test
    window.document.dispatchEvent(new Event('DOMContentLoaded', {
      bubbles: true,
      cancelable: true
    }))
    
    vi.clearAllMocks()
  })

  // Helper untuk menunggu microtask (MutationObserver & scheduleFlush)
  const flush = () => new Promise(resolve => queueMicrotask(resolve))

  it('should initialize a scope and call connect', async () => {
    const connectFn = vi.fn()
    
    defineScope('counter', () => ({
      connect: connectFn
    }))

    // Tambah elemen ke DOM
    const el = document.createElement('div')
    el.setAttribute('data-scope', 'counter')
    document.body.appendChild(el)

    // Tunggu MutationObserver flush
    await flush()

    expect(connectFn).toHaveBeenCalledTimes(1)
  })

  it('should provide targets and values to the setup function', async () => {
    let capturedTargets, capturedValues
    
    defineScope('user', ({ targets, values }) => {
      capturedTargets = targets
      capturedValues = values
      return {}
    })

    document.body.innerHTML = `
      <div data-scope="user" data-name="Gemini">
        <span data-target="title">Hello</span>
      </div>
    `
    await flush()

    expect(capturedValues.name).toBe('Gemini')
    expect(capturedTargets.title.textContent).toBe('Hello')
  })

  it('should trigger methods via data-action click', async () => {
    const changeFn = vi.fn()
    
    defineScope('app', () => ({
      change: changeFn
    }))

    document.body.innerHTML = `
      <div data-scope="app">
        <button data-action="click->change" data-id="123">Click Me</button>
      </div>
    `
    await flush()

    const btn = document.querySelector('button')
    btn.click()

    expect(changeFn).toHaveBeenCalled()
    
    // Cek arguments (ctx)
    const ctx = changeFn.mock.calls[0][0]
    expect(ctx.element).toBe(btn)
    expect(ctx.params.id).toBe('123')
    expect(ctx.event.type).toBe('click')
  })

  it('should handle multiple space-separated actions', async () => {
    const focusFn = vi.fn()
    const inputFn = vi.fn()

    defineScope('form', () => ({
      onFocus: focusFn,
      onInput: inputFn
    }))

    document.body.innerHTML = `
      <div data-scope="form">
        <input data-action="focus->onFocus input->onInput">
      </div>
    `
    await flush()

    const input = document.querySelector('input')
    input.dispatchEvent(new Event('focus', { bubbles: true }))
    input.dispatchEvent(new Event('input', { bubbles: true }))

    expect(focusFn).toHaveBeenCalled()
    expect(inputFn).toHaveBeenCalled()
  })

  it('should call disconnect when element is removed', async () => {
    const disconnectFn = vi.fn()

    defineScope('destroy', () => ({
      disconnect: disconnectFn
    }))

    document.body.innerHTML = '<div data-scope="destroy" id="target"></div>'
    await flush()

    const el = document.getElementById('target')
    el.remove()
    
    await flush() // Tunggu scheduleFlush di microtask

    expect(disconnectFn).toHaveBeenCalledTimes(1)
  })

  it('should bubble to the closest scope', async () => {
    const outerFn = vi.fn()
    const innerFn = vi.fn()

    defineScope('outer', () => ({ call: outerFn }))
    defineScope('inner', () => ({ call: innerFn }))

    document.body.innerHTML = `
      <div data-scope="outer">
        <div data-scope="inner">
          <button data-action="click->call">Click</button>
        </div>
      </div>
    `
    await flush()

    document.querySelector('button').click()

    // Harus panggil scope terdekat (inner), bukan outer
    expect(innerFn).toHaveBeenCalled()
    expect(outerFn).not.toHaveBeenCalled()
  })
})
