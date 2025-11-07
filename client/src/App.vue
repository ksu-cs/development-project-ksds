<script setup>
import { ref, watch, useTemplateRef } from 'vue';
import BaseMap from './components/BaseMap.vue'

const sliderTimeout = 2000; // miliseconds;
const inputSlider = useTemplateRef("inputSlider");
const inputValue = ref(null);

var intervalId = null;
var active = ref(false);

const play = ref({
    playOpacity: "100%"
})

const pause = ref({
    pauseOpacity: "0%"
})

watch(() => active.value,
    () => {
        if (active.value) {
            intervalId = window.setInterval(incrementSlider, sliderTimeout);
        }
        else {
            window.clearInterval(intervalId);
        }
    })

function playButtonClick() {
    play.value.playOpacity = active.value ? "100%" : "0%";
    pause.value.pauseOpacity = active.value ? "0%" : "100%";
    active.value = !active.value;
}

function incrementSlider() {
    const step = parseInt(inputSlider.value.value) + parseInt(inputSlider.value.step);
    const clamp = Math.max(inputSlider.value.min, Math.min(inputSlider.value.max, step));
    inputSlider.value.value = clamp
    inputValue.value = clamp;
}
</script>

<template>
    <div class="app-container">
        <div class="timeline">
            <div class="yearSelection">
                <input ref="inputSlider" type="range" id="yearSlider" min="1860" max="2025" step="10" value="1860" />
                <button class="playButton" @click="playButtonClick">
                    <svg viewBox="0 0 50 50">
                        <path id="play-icon" d="M36,25L15,37L15,13Z"></path>
                        <path id="pause-icon" d="M16,13L16,37M34,13L34,37"></path>
                    </svg>
                </button>
            </div>
            <span id="yearLabel">1860</span>
        </div>
    <BaseMap :inputValue="inputValue" />
  </div>
</template>

<style scoped>
input {
    width: 60%;
    margin-right: 10px;
}

.app-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.timeline {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
}

.yearSelection {
    width: 80%;
    display: flex;
    flex-direction: row;
    justify-content: center;
}

.playButton {
    width: 50px;
    height: 50px;
    padding: 0px;
    background: #D3D3D3;
    border: 0;
    border-radius: 10px;
    box-shadow: 0 5px 5px 2px rgba(0, 0, 0, 0.6);
    cursor: pointer;
    transition: all 1s ease, transform 200ms ease, box-shadow 200ms ease;
}

#play-icon {
    fill: #5E5E5E;
    stroke: #5E5E5E;
    stroke-width: 2;
    stroke-linejoin: bevel;
    opacity: v-bind('play.playOpacity');
    transition: all 1s ease, opacity 200ms;
}

#pause-icon {
    fill: none;
    stroke: #5E5E5E;
    stroke-width: 10;
    stroke-linecap: round;
    opacity: v-bind('pause.pauseOpacity');
    transition: all 1s ease, opacity 200ms;
}

.playButton:hover svg #play-icon{
    fill: #808080;
    stroke: #808080;
}

.playButton:hover svg #pause-icon {
    stroke: #808080;
}

.playButton:hover {
    background: #E5E4E2;
}

.playButton:active {
    transform: translateY(5%);
    box-shadow: 0 3px 5px 2px rgba(0, 0, 0, 0.4);
}
</style>
