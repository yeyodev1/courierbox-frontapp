import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'
import { gsap } from 'gsap'

const META_SELECTOR = '.mega-meta-item'

/** Vue passes either the element or the component instance holding it. */
export type ItemRefSetter = (index: number) => (el: Element | null | { $el?: Element }) => void

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Staggered entrance for the menu rows, plus the body scroll-lock and Escape
 * handling that belong to the open/closed lifecycle.
 */
export function useMegaMenuReveal(open: Ref<boolean>, onClose: () => void) {
  const itemRefs: HTMLElement[] = []

  /** RouterLink hands back a component instance, so unwrap `$el` when present. */
  const setItemRef: ItemRefSetter = (index) => (el) => {
    const node = (el && (el as { $el?: Element }).$el ? (el as { $el?: Element }).$el : el) as HTMLElement | null
    if (node) itemRefs[index] = node
  }

  async function animateOpen() {
    await nextTick()
    if (prefersReducedMotion()) {
      gsap.set(itemRefs, { y: 0, opacity: 1 })
      gsap.set(META_SELECTOR, { y: 0, opacity: 1 })
      return
    }
    gsap.killTweensOf([itemRefs, META_SELECTOR])
    gsap.fromTo(
      itemRefs,
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.07, duration: 0.85, ease: 'expo.out', delay: 0.15 },
    )
    gsap.fromTo(
      META_SELECTOR,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.55, ease: 'expo.out', delay: 0.45 },
    )
  }

  function reset() {
    gsap.killTweensOf([itemRefs, META_SELECTOR])
    gsap.set(itemRefs, { y: 0, opacity: 1, clearProps: 'transform,opacity' })
    gsap.set(META_SELECTOR, { y: 0, opacity: 1, clearProps: 'transform,opacity' })
  }

  watch(open, (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) animateOpen()
    else reset()
  })

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open.value) onClose()
  }

  if (typeof window !== 'undefined') window.addEventListener('keydown', onKeydown)

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
  })

  return { setItemRef }
}
