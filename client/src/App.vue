<script setup>
import BaseMap from './components/BaseMap.vue'
</script>

<template>
  <div class="app-container">
    <input type="range" id="yearSlider" min="1860" max="2025" step="10" value="1860" />
    <span id="yearLabel">1860</span>
    <BaseMap />
  </div>
</template>

<style scoped>
input {
  width: 60%;
}

.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
