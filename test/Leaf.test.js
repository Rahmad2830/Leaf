import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineScope } from '../dist/Leaf.min.js'

describe('Scope Framework', () => {
  let container

  beforeEach(() => {
    // Setup DOM container
    container = document.createElement('div')
    container.id = 'test-container'
    document.body.appendChild(container)

    // Clear any existing scopes
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
    container.remove()
  })

  // Helper untuk menunggu microtask
  const waitForMicrotask = () => new Promise(resolve => queueMicrotask(resolve))

  describe('Basic Scope Registration', () => {
    it('should register a scope definition', () => {
      const callback = vi.fn()
      defineScope('test', callback)
      
      expect(callback).not.toHaveBeenCalled()
    })

    it('should initialize scope on element with data-scope', async () => {
      const connectFn = vi.fn()
      const setupFn = vi.fn(() => ({ connect: connectFn }))
      
      defineScope('counter', setupFn)
      
      container.innerHTML = '<div data-scope="counter"></div>'
      
      await waitForMicrotask()
      
      expect(setupFn).toHaveBeenCalledTimes(1)
      expect(connectFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Root, Targets, and Values', () => {
    it('should provide root element to controller', async () => {
      let capturedRoot
      
      defineScope('test', ({ root }) => {
        capturedRoot = root
        return {}
      })
      
      container.innerHTML = '<div data-scope="test" id="my-root"></div>'
      
      await waitForMicrotask()
      
      expect(capturedRoot).toBeDefined()
      expect(capturedRoot.id).toBe('my-root')
    })

    it('should provide targets proxy for querying elements', async () => {
      let capturedTargets
      
      defineScope('form', ({ targets }) => {
        capturedTargets = targets
        return {}
      })
      
      container.innerHTML = `
        <div data-scope="form">
          <input data-target="email" type="email" />
          <input data-target="password" type="password" />
          <button data-target="submit">Submit</button>
        </div>
      `
      
      await waitForMicrotask()
      
      expect(capturedTargets.email).toBeDefined()
      expect(capturedTargets.email.type).toBe('email')
      expect(capturedTargets.password.type).toBe('password')
      expect(capturedTargets.submit.textContent).toBe('Submit')
    })

    it('should provide targets.all for querySelectorAll', async () => {
      let capturedTargets
      
      defineScope('list', ({ targets }) => {
        capturedTargets = targets
        return {}
      })
      
      container.innerHTML = `
        <div data-scope="list">
          <div data-target="item">Item 1</div>
          <div data-target="item">Item 2</div>
          <div data-target="item">Item 3</div>
        </div>
      `
      
      await waitForMicrotask()
      
      const items = capturedTargets.all.item
      expect(items.length).toBe(3)
      expect(items[0].textContent).toBe('Item 1')
      expect(items[2].textContent).toBe('Item 3')
    })

    it('should provide values proxy for data attributes', async () => {
      let capturedValues
      
      defineScope('config', ({ values }) => {
        capturedValues = values
        return {}
      })
      
      container.innerHTML = `
        <div data-scope="config" data-count="5" data-name="test"></div>
      `
      
      await waitForMicrotask()
      
      expect(capturedValues.count).toBe('5')
      expect(capturedValues.name).toBe('test')
    })

    it('should allow setting values via proxy', async () => {
      let capturedValues
      
      defineScope('setter', ({ values }) => {
        capturedValues = values
        return {}
      })
      
      container.innerHTML = `
        <div data-scope="setter" data-status="initial"></div>
      `
      
      await waitForMicrotask()
      
      capturedValues.status = 'updated'
      
      const element = container.querySelector('[data-scope="setter"]')
      expect(element.dataset.status).toBe('updated')
    })

    it('should update targets dynamically when DOM changes', async () => {
      let capturedTargets
      
      defineScope('dynamic', ({ targets }) => {
        capturedTargets = targets
        return {}
      })
      
      container.innerHTML = `
        <div data-scope="dynamic">
          <div data-target="output">Initial</div>
        </div>
      `
      
      await waitForMicrotask()
      
      expect(capturedTargets.output.textContent).toBe('Initial')
      
      // Update DOM
      const scope = container.querySelector('[data-scope="dynamic"]')
      const newTarget = document.createElement('div')
      newTarget.dataset.target = 'output'
      newTarget.textContent = 'Updated'
      scope.replaceChild(newTarget, scope.firstElementChild)
      
      // Targets should reflect new DOM
      expect(capturedTargets.output.textContent).toBe('Updated')
    })
  })

  describe('Action Event Handling', () => {
    it('should handle click action with params, element, and event', async () => {
      const clickHandler = vi.fn()
      
      defineScope('button', () => ({
        handleClick: clickHandler
      }))
      
      container.innerHTML = `
        <div data-scope="button">
          <button data-action="click->handleClick" data-id="123">Click Me</button>
        </div>
      `
      
      await waitForMicrotask()
      
      const button = container.querySelector('button')
      button.click()
      
      expect(clickHandler).toHaveBeenCalledTimes(1)
      
      const ctx = clickHandler.mock.calls[0][0]
      expect(ctx.element).toBe(button)
      expect(ctx.event).toBeDefined()
      expect(ctx.event.type).toBe('click')
      expect(ctx.params.id).toBe('123')
    })

    it('should provide params proxy for reading data attributes', async () => {
      const submitHandler = vi.fn()
      
      defineScope('form', () => ({
        handleSubmit: submitHandler
      }))
      
      container.innerHTML = `
        <div data-scope="form">
          <form data-action="submit->handleSubmit" data-endpoint="/api" data-method="POST">
            <button type="submit">Submit</button>
          </form>
        </div>
      `
      
      await waitForMicrotask()
      
      const form = container.querySelector('form')
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)
      
      expect(submitHandler).toHaveBeenCalledTimes(1)
      
      const ctx = submitHandler.mock.calls[0][0]
      expect(ctx.params.endpoint).toBe('/api')
      expect(ctx.params.method).toBe('POST')
    })

    it('should allow setting params via proxy', async () => {
      const clickHandler = vi.fn()
      
      defineScope('updater', () => ({
        update: (ctx) => {
          ctx.params.clicked = 'true'
          clickHandler(ctx)
        }
      }))
      
      container.innerHTML = `
        <div data-scope="updater">
          <button data-action="click->update" data-clicked="false">Update</button>
        </div>
      `
      
      await waitForMicrotask()
      
      const button = container.querySelector('button')
      button.click()
      
      expect(button.dataset.clicked).toBe('true')
      expect(clickHandler).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple actions on same element', async () => {
      const focusHandler = vi.fn()
      const blurHandler = vi.fn()
      
      defineScope('input', () => ({
        onFocus: focusHandler,
        onBlur: blurHandler
      }))
      
      container.innerHTML = `
        <div data-scope="input">
          <input data-action="focus->onFocus blur->onBlur" />
        </div>
      `
      
      await waitForMicrotask()
      
      const input = container.querySelector('input')
      input.dispatchEvent(new Event('focus', { bubbles: true }))
      input.dispatchEvent(new Event('blur', { bubbles: true }))
      
      expect(focusHandler).toHaveBeenCalledTimes(1)
      expect(blurHandler).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple space-separated actions', async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      
      defineScope('multi', () => ({
        action1: handler1,
        action2: handler2
      }))
      
      container.innerHTML = `
        <div data-scope="multi">
          <button data-action="click->action1 click->action2">Multi</button>
        </div>
      `
      
      await waitForMicrotask()
      
      const button = container.querySelector('button')
      button.click()
      
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should bubble events to closest scope element', async () => {
      const clickHandler = vi.fn()
      
      defineScope('outer', () => ({
        handleClick: clickHandler
      }))
      
      container.innerHTML = `
        <div data-scope="outer">
          <div class="wrapper">
            <span data-action="click->handleClick">Click nested</span>
          </div>
        </div>
      `
      
      await waitForMicrotask()
      
      const span = container.querySelector('span')
      span.click()
      
      expect(clickHandler).toHaveBeenCalledTimes(1)
      const ctx = clickHandler.mock.calls[0][0]
      expect(ctx.element).toBe(span)
    })
  })

  describe('Scope Lifecycle', () => {
    it('should not initialize scope twice', async () => {
      const connectFn = vi.fn()
      const setupFn = vi.fn(() => ({ connect: connectFn }))
      
      defineScope('unique', setupFn)
      
      container.innerHTML = '<div data-scope="unique"></div>'
      
      await waitForMicrotask()
      
      // Trigger another action to potentially re-initialize
      const button = document.createElement('button')
      button.dataset.action = 'click->test'
      container.querySelector('[data-scope="unique"]').appendChild(button)
      button.click()
      
      await waitForMicrotask()
      
      expect(setupFn).toHaveBeenCalledTimes(1)
      expect(connectFn).toHaveBeenCalledTimes(1)
    })

    it('should call disconnect when element is removed', async () => {
      const disconnectFn = vi.fn()
      
      defineScope('removable', () => ({
        disconnect: disconnectFn
      }))
      
      container.innerHTML = '<div data-scope="removable"></div>'
      
      await waitForMicrotask()
      
      const element = container.querySelector('[data-scope="removable"]')
      element.remove()
      
      await waitForMicrotask()
      
      expect(disconnectFn).toHaveBeenCalledTimes(1)
    })

    it('should delete instance after disconnect', async () => {
      const disconnectFn = vi.fn()
      const reconnectFn = vi.fn()
      
      defineScope('reconnect', () => ({
        connect: reconnectFn,
        disconnect: disconnectFn
      }))
      
      container.innerHTML = '<div data-scope="reconnect"></div>'
      
      await waitForMicrotask()
      expect(reconnectFn).toHaveBeenCalledTimes(1)
      
      const element = container.querySelector('[data-scope="reconnect"]')
      element.remove()
      
      await waitForMicrotask()
      expect(disconnectFn).toHaveBeenCalledTimes(1)
      
      // Re-add element
      container.appendChild(element)
      
      await waitForMicrotask()
      expect(reconnectFn).toHaveBeenCalledTimes(2) // Should reconnect
    })

    it('should connect nested scopes', async () => {
      const parentConnect = vi.fn()
      const childConnect = vi.fn()
      
      defineScope('parent', () => ({ connect: parentConnect }))
      defineScope('child', () => ({ connect: childConnect }))
      
      container.innerHTML = `
        <div data-scope="parent">
          <div data-scope="child"></div>
        </div>
      `
      
      await waitForMicrotask()
      
      expect(parentConnect).toHaveBeenCalledTimes(1)
      expect(childConnect).toHaveBeenCalledTimes(1)
    })

    it('should disconnect nested scopes when parent is removed', async () => {
      const parentDisconnect = vi.fn()
      const childDisconnect = vi.fn()
      
      defineScope('parent', () => ({ disconnect: parentDisconnect }))
      defineScope('child', () => ({ disconnect: childDisconnect }))
      
      container.innerHTML = `
        <div data-scope="parent">
          <div data-scope="child"></div>
        </div>
      `
      
      await waitForMicrotask()
      
      const parent = container.querySelector('[data-scope="parent"]')
      parent.remove()
      
      await waitForMicrotask()
      
      expect(parentDisconnect).toHaveBeenCalledTimes(1)
      expect(childDisconnect).toHaveBeenCalledTimes(1)
    })

    it('should handle dynamically added scopes', async () => {
      const connectFn = vi.fn()
      
      defineScope('dynamic', () => ({ connect: connectFn }))
      
      const newElement = document.createElement('div')
      newElement.dataset.scope = 'dynamic'
      container.appendChild(newElement)
      
      await waitForMicrotask()
      
      expect(connectFn).toHaveBeenCalledTimes(1)
    })

    it('should not disconnect scope that was removed and re-added in same flush', async () => {
      const connectFn = vi.fn()
      const disconnectFn = vi.fn()
      
      defineScope('moved', () => ({
        connect: connectFn,
        disconnect: disconnectFn
      }))
      
      container.innerHTML = '<div data-scope="moved"></div>'
      
      await waitForMicrotask()
      expect(connectFn).toHaveBeenCalledTimes(1)
      
      // Remove and re-add in same tick
      const element = container.querySelector('[data-scope="moved"]')
      element.remove()
      container.appendChild(element)
      
      await waitForMicrotask()
      
      // Should not disconnect because it was re-added before flush
      expect(disconnectFn).not.toHaveBeenCalled()
      expect(connectFn).toHaveBeenCalledTimes(1) // Still only 1
    })
  })

  describe('Error Handling', () => {
    it('should log error when scope is not found', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      container.innerHTML = '<div data-scope="nonexistent"></div>'
      
      await waitForMicrotask()
      
      expect(consoleError).toHaveBeenCalledWith('Scope nonexistent not found')
      
      consoleError.mockRestore()
    })

    it('should warn when action method is not found', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      defineScope('missing', () => ({}))
      
      container.innerHTML = `
        <div data-scope="missing">
          <button data-action="click->nonexistent">Click</button>
        </div>
      `
      
      await waitForMicrotask()
      
      const button = container.querySelector('button')
      button.click()
      
      expect(consoleWarn).toHaveBeenCalledWith('scope:missing method "nonexistent" not found')
      
      consoleWarn.mockRestore()
    })

    it('should log error when action method throws', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      defineScope('error', () => ({
        throwError: () => {
          throw new Error('Test error')
        }
      }))
      
      container.innerHTML = `
        <div data-scope="error">
          <button data-action="click->throwError">Click</button>
        </div>
      `
      
      await waitForMicrotask()
      
      const button = container.querySelector('button')
      button.click()
      
      expect(consoleError).toHaveBeenCalledWith(
        '[scope:error] throwError() failed',
        expect.any(Error)
      )
      
      consoleError.mockRestore()
    })

    it('should not call disconnect if controller does not have disconnect method', async () => {
      defineScope('simple', () => ({}))
      
      container.innerHTML = '<div data-scope="simple"></div>'
      
      await waitForMicrotask()
      
      const element = container.querySelector('[data-scope="simple"]')
      
      // Should not throw
      expect(() => element.remove()).not.toThrow()
      
      await waitForMicrotask()
    })

    it('should handle action on element without scope parent gracefully', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      container.innerHTML = `
        <button data-action="click->test">Orphan</button>
      `
      
      await waitForMicrotask()
      
      const button = container.querySelector('button')
      
      // Should not throw
      expect(() => button.click()).not.toThrow()
      
      consoleWarn.mockRestore()
    })
  })

  describe('Event Types', () => {
    it('should handle input event', async () => {
      const inputHandler = vi.fn()
      
      defineScope('input', () => ({
        onInput: inputHandler
      }))
      
      container.innerHTML = `
        <div data-scope="input">
          <input data-action="input->onInput" />
        </div>
      `
      
      await waitForMicrotask()
      
      const input = container.querySelector('input')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      
      expect(inputHandler).toHaveBeenCalledTimes(1)
    })

    it('should handle keydown event', async () => {
      const keydownHandler = vi.fn()
      
      defineScope('keyboard', () => ({
        onKeydown: keydownHandler
      }))
      
      container.innerHTML = `
        <div data-scope="keyboard">
          <input data-action="keydown->onKeydown" />
        </div>
      `
      
      await waitForMicrotask()
      
      const input = container.querySelector('input')
      input.dispatchEvent(new Event('keydown', { bubbles: true }))
      
      expect(keydownHandler).toHaveBeenCalledTimes(1)
    })

    it('should handle change event', async () => {
      const changeHandler = vi.fn()
      
      defineScope('select', () => ({
        onChange: changeHandler
      }))
      
      container.innerHTML = `
        <div data-scope="select">
          <select data-action="change->onChange">
            <option>Option 1</option>
          </select>
        </div>
      `
      
      await waitForMicrotask()
      
      const select = container.querySelector('select')
      select.dispatchEvent(new Event('change', { bubbles: true }))
      
      expect(changeHandler).toHaveBeenCalledTimes(1)
    })

    it('should handle pointerdown event', async () => {
      const pointerHandler = vi.fn()
      
      defineScope('pointer', () => ({
        onPointer: pointerHandler
      }))
      
      container.innerHTML = `
        <div data-scope="pointer">
          <button data-action="pointerdown->onPointer">Touch</button>
        </div>
      `
      
      await waitForMicrotask()
      
      const button = container.querySelector('button')
      button.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      
      expect(pointerHandler).toHaveBeenCalledTimes(1)
    })

    it('should use capture phase for event listening', async () => {
      const order = []
      
      defineScope('capture', () => ({
        onClick: () => order.push('scope')
      }))
      
      container.innerHTML = `
        <div data-scope="capture">
          <button data-action="click->onClick">Click</button>
        </div>
      `
      
      await waitForMicrotask()
      
      const button = container.querySelector('button')
      button.addEventListener('click', () => order.push('bubble'))
      
      button.click()
      
      // Capture should fire before bubble
      expect(order).toEqual(['scope', 'bubble'])
    })
  })

  describe('Auto-initialization', () => {
    it('should auto-connect scope when action is triggered on uninitialized scope', async () => {
      const connectFn = vi.fn()
      const clickHandler = vi.fn()
      
      defineScope('lazy', () => ({
        connect: connectFn,
        onClick: clickHandler
      }))
      
      // Create element but don't wait for auto-init
      container.innerHTML = `
        <div data-scope="lazy">
          <button data-action="click->onClick">Click</button>
        </div>
      `
      
      // Immediately click before microtask runs
      const button = container.querySelector('button')
      button.click()
      
      expect(connectFn).toHaveBeenCalled()
      expect(clickHandler).toHaveBeenCalled()
    })
  })
})