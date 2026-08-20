<script setup lang="ts">
/**
 * Users tab of the legacy single-page panel. It used to carry its own copy of the
 * roster and the create/edit/delete flows; it now renders the same view the
 * routed `/admin/usuarios` uses, so both stay in sync.
 */
import AdminUsersView from '@/views/admin/AdminUsersView.vue'
</script>

<template>
  <AdminUsersView />
</template>
