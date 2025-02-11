<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
html,
body {
  @apply h-full w-full m-0 p-0 overflow-hidden;
}

#app {
  @apply h-full w-full;
}
</style>
