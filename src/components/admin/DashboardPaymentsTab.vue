<script setup lang="ts">
/**
 * Payment-links tab of the legacy single-page panel. It used to duplicate the
 * link generator and the payments table; it now renders the same view the routed
 * `/admin/pagos` uses, so both stay in sync.
 */
import AdminPaymentsView from '@/views/admin/AdminPaymentsView.vue'
</script>

<template>
  <AdminPaymentsView />
</template>
