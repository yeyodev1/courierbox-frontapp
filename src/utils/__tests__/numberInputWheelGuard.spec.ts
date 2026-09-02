import { afterEach, describe, expect, it, vi } from 'vitest'
import { installNumberInputWheelGuard } from '../numberInputWheelGuard'

/**
 * Scrolling over a focused number input walked a $3.00 rate down to $2.91 and
 * pinned commissions at zero. The guard blurs the field so the browser's wheel
 * increment never applies.
 */
function makeInput(type: string) {
  const input = document.createElement('input')
  input.type = type
  document.body.appendChild(input)
  return input
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('installNumberInputWheelGuard', () => {
  it('blurs a focused number input so the wheel cannot change its value', () => {
    const uninstall = installNumberInputWheelGuard()
    const input = makeInput('number')
    input.focus()
    const blur = vi.spyOn(input, 'blur')

    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))

    expect(blur).toHaveBeenCalled()
    uninstall()
  })

  it('leaves a text input alone, since the wheel never edits it', () => {
    const uninstall = installNumberInputWheelGuard()
    const input = makeInput('text')
    input.focus()
    const blur = vi.spyOn(input, 'blur')

    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))

    expect(blur).not.toHaveBeenCalled()
    uninstall()
  })

  it('leaves an unfocused number input alone, so scrolling the page is unaffected', () => {
    const uninstall = installNumberInputWheelGuard()
    const input = makeInput('number')
    const blur = vi.spyOn(input, 'blur')

    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))

    expect(blur).not.toHaveBeenCalled()
    uninstall()
  })

  it('stops guarding once uninstalled', () => {
    const uninstall = installNumberInputWheelGuard()
    uninstall()
    const input = makeInput('number')
    input.focus()
    const blur = vi.spyOn(input, 'blur')

    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))

    expect(blur).not.toHaveBeenCalled()
  })
})
