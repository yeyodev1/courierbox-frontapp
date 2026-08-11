import { nextTick, onBeforeUnmount, ref, watch, type Ref } from "vue";

/**
 * Shared behaviour for every overlay in the app: body scroll-lock, focus trap,
 * focus restoration and Escape handling.
 *
 * Scroll-lock is reference counted at module level so stacked modals (a confirm
 * dialog opened from inside a form modal) don't unlock the page when the inner
 * one closes.
 */

let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

function lockScroll() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    const body = document.body;
    savedOverflow = body.style.overflow;
    savedPaddingRight = body.style.paddingRight;
    // Compensate the scrollbar so the layout doesn't jump when it disappears.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    body.style.overflow = "hidden";
    body.classList.add("has-modal-open");
  }
  lockCount += 1;
}

function unlockScroll() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    const body = document.body;
    body.style.overflow = savedOverflow;
    body.style.paddingRight = savedPaddingRight;
    body.classList.remove("has-modal-open");
  }
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

export interface ModalBehaviorOptions {
  /** Reactive open state of the modal. */
  isOpen: Ref<boolean>;
  /** Element that wraps the modal content — the focus trap boundary. */
  container: Ref<HTMLElement | null>;
  /** Called when the user presses Escape. No-op if omitted. */
  onEscape?: () => void;
  /** When false, Escape is ignored (e.g. a modal in a blocking state). */
  closable?: () => boolean;
}

export function useModalBehavior(options: ModalBehaviorOptions) {
  const { isOpen, container, onEscape } = options;
  const previouslyFocused = ref<HTMLElement | null>(null);

  function canClose() {
    return options.closable ? options.closable() : true;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen.value) return;

    if (e.key === "Escape") {
      if (canClose() && onEscape) {
        e.stopPropagation();
        onEscape();
      }
      return;
    }

    if (e.key !== "Tab" || !container.value) return;

    const items = focusableWithin(container.value);
    if (items.length === 0) {
      // Nothing focusable inside — keep focus on the container itself.
      e.preventDefault();
      container.value.focus();
      return;
    }

    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey && (active === first || !container.value.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  async function activate() {
    previouslyFocused.value = (document.activeElement as HTMLElement) ?? null;
    lockScroll();
    document.addEventListener("keydown", handleKeydown, true);
    await nextTick();
    if (!container.value) return;
    const items = focusableWithin(container.value);
    // Prefer the first real control over the close button when there is one.
    const target = items.find((el) => !el.hasAttribute("data-modal-dismiss")) ?? items[0];
    (target ?? container.value).focus({ preventScroll: true });
  }

  function deactivate() {
    document.removeEventListener("keydown", handleKeydown, true);
    unlockScroll();
    previouslyFocused.value?.focus?.({ preventScroll: true });
    previouslyFocused.value = null;
  }

  let active = false;

  watch(
    isOpen,
    (open) => {
      if (open && !active) {
        active = true;
        void activate();
      } else if (!open && active) {
        active = false;
        deactivate();
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    if (active) {
      active = false;
      deactivate();
    }
  });
}
