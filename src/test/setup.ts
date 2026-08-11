import { config } from '@vue/test-utils'

/**
 * Overlays (AppModal / AppConfirmModal / AppOverlay) teleport to <body>, which
 * puts their content outside the mounted wrapper. Stubbing Teleport keeps it
 * rendered in place so component tests can assert on it normally.
 */
config.global.stubs = {
  ...config.global.stubs,
  teleport: true,
}
