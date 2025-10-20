<script setup>
import BaseMap from './components/BaseMap.vue'
</script>

<template>
  <div class="container">
    <input type="range" name="year" min="0" max="10" />
    <BaseMap />
  </div>
</template>

<style scoped>
input {
  width: 60%;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
