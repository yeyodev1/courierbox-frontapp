import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'
import { useModalBehavior } from './useModalBehavior'

function makeHost(isOpen: Ref<boolean>, onEscape = () => {}) {
  return defineComponent({
    setup() {
      const container = ref<HTMLElement | null>(null)
      useModalBehavior({ isOpen, container, onEscape })
      return () =>
        h('div', { ref: container, tabindex: -1 }, [
          h('button', { type: 'button' }, 'ok'),
        ])
    },
  })
}

describe('useModalBehavior', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
    document.body.classList.remove('has-modal-open')
  })

  it('locks the body while open and restores it on close', async () => {
    const isOpen = ref(false)
    const wrapper = mount(makeHost(isOpen), { attachTo: document.body })

    expect(document.body.style.overflow).toBe('')

    isOpen.value = true
    await wrapper.vm.$nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.classList.contains('has-modal-open')).toBe(true)

    isOpen.value = false
    await wrapper.vm.$nextTick()
    expect(document.body.style.overflow).toBe('')
    expect(document.body.classList.contains('has-modal-open')).toBe(false)

    wrapper.unmount()
  })

  it('keeps the lock while a second overlay is still open', async () => {
    const outer = ref(true)
    const inner = ref(true)
    const a = mount(makeHost(outer), { attachTo: document.body })
    const b = mount(makeHost(inner), { attachTo: document.body })

    expect(document.body.style.overflow).toBe('hidden')

    // Closing the nested overlay must not unlock the page behind it.
    inner.value = false
    await b.vm.$nextTick()
    expect(document.body.style.overflow).toBe('hidden')

    outer.value = false
    await a.vm.$nextTick()
    expect(document.body.style.overflow).toBe('')

    a.unmount()
    b.unmount()
  })

  it('releases the lock when an open modal unmounts without closing', async () => {
    const isOpen = ref(true)
    const wrapper = mount(makeHost(isOpen), { attachTo: document.body })
    expect(document.body.style.overflow).toBe('hidden')

    wrapper.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('calls onEscape only while open', async () => {
    const isOpen = ref(false)
    let escapes = 0
    const wrapper = mount(makeHost(isOpen, () => (escapes += 1)), { attachTo: document.body })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(escapes).toBe(0)

    isOpen.value = true
    await wrapper.vm.$nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(escapes).toBe(1)

    isOpen.value = false
    await wrapper.vm.$nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(escapes).toBe(1)

    wrapper.unmount()
  })
})
