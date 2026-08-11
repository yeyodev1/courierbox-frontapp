import { useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'

/**
 * The admin, asesor and bodega shells pin themselves to the viewport and scroll
 * an inner pane, so the sidebar and top bar never move. The router's
 * scrollBehavior only ever scrolls the window — which in those shells no longer
 * scrolls at all — so putting the pane back at its top is on us.
 *
 * Watching `path` and not the whole route is the point: changing section starts
 * at the top, but filtering, paging a table or switching a tab only moves the
 * query, and those keep the reader exactly where they were.
 *
 * Call from a shell's setup and give its scrolling element `ref="contentPane"`.
 */
export function useContentScroll(refName = 'contentPane') {
  const pane = useTemplateRef<HTMLElement>(refName)
  const route = useRoute()

  watch(
    () => route.path,
    () => {
      // The pane belongs to the shell, not to the view, so it outlives the
      // route change and is already mounted by the time this runs.
      pane.value?.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    },
  )

  return { pane }
}
