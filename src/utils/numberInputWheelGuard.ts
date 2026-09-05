/**
 * `<input type="number">` changes its value when the wheel turns over a focused
 * field. On the cost and commission forms that silently rewrote money: typing a
 * $3.00 rate and then scrolling down to reach "Guardar" walked the field to
 * $2.91, and a longer scroll pinned a commission at its `min="0"`. The operator
 * saw the right number while typing and a different one after saving.
 *
 * Blurring the field on the first wheel tick drops the browser's increment
 * before it applies — the page keeps scrolling, the number stops moving. The
 * listener is passive and global so a form added later is covered by default,
 * which is the part that failed the first time round.
 */
export function installNumberInputWheelGuard(target: Document = document): () => void {
  const onWheel = (event: WheelEvent) => {
    const active = target.activeElement
    if (!(active instanceof HTMLInputElement) || active.type !== 'number') return
    if (event.target !== active) return
    active.blur()
  }

  target.addEventListener('wheel', onWheel, { passive: true })
  return () => target.removeEventListener('wheel', onWheel)
}
