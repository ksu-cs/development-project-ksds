<script setup>
	import { ref, watch, useTemplateRef, onMounted } from 'vue';
	import BaseMap from './components/BaseMap.vue';

	const slider = {
		element: useTemplateRef('inputSlider'),
		yearLabel: useTemplateRef('yearLabel'),
		yearRef: ref(1860),
		get year() {
			return this.yearRef.value;
		},
		set year(value) {
			this.yearRef.value = value;
		},
	};

	const playButton = {
		activeRef: ref(false),
		timeout: 3500,
		intervalID: null,
		opacityRef: ref({
			play: '100%',
			pause: '0%',
		}),
		get active() {
			return this.activeRef.value;
		},
		set active(value) {
			this.activeRef.value = value;
		},
		get opacity() {
			return this.opacityRef.value;
		},
	};

	/*
	 * In the future, this can be set by a UI element,
	 * but, since we are only focusing on Kansas right now,
	 * it is constant.
	 */
	const statePath = 'kansas';

	watch(() => playButton.active, checkInterval);

	onMounted(() => {
		slider.element.value.oninput = () => {
			updateYear(+slider.element.value.value); // the + converts the value to a number
		};
	});

	function checkInterval(newValue) {
		if (newValue) {
			playButton.intervalID = window.setInterval(
				incrementSlider,
				playButton.timeout
			);
		} else {
			window.clearInterval(playButton.intervalID);
		}
	}

	function playButtonClick() {
		if (playButton.active) {
			playButton.opacity.play = '100%';
			playButton.opacity.pause = '0%';
		} else {
			playButton.opacity.play = '0%';
			playButton.opacity.pause = '100%';
		}
		playButton.active = !playButton.active;
	}

	function incrementSlider() {
		const element = slider.element.value;
		const step = parseInt(element.value) + parseInt(element.step);
		const clamp = Math.max(element.min, Math.min(element.max, step));
		element.value = clamp;
		updateYear(clamp);
	}

	function updateYear(year) {
		slider.year = year;
		slider.yearLabel.value.textContent = String(year);
	}
</script>

<template>
	<div class="app-container">
		<div class="timeline">
			<div class="yearSelection">
				<input
					ref="inputSlider"
					type="range"
					id="yearSlider"
					min="1860"
					max="2020"
					step="10"
					value="1860"
				/>
				<button class="playButton" @click="playButtonClick">
					<svg viewBox="0 0 50 50">
						<path id="play-icon" d="M36,25L15,37L15,13Z"></path>
						<path
							id="pause-icon"
							d="M16,13L16,37M34,13L34,37"
						></path>
					</svg>
				</button>
			</div>
			<span id="yearLabel" ref="yearLabel">1860</span>
		</div>
		<BaseMap :inputValue="slider.yearRef" :statePath="statePath" />
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
		background: #d3d3d3;
		border: 0;
		border-radius: 10px;
		box-shadow: 0 5px 5px 2px rgba(0, 0, 0, 0.6);
		cursor: pointer;
		transition:
			all 1s ease,
			transform 200ms ease,
			box-shadow 200ms ease;
	}

	#play-icon {
		fill: #5e5e5e;
		stroke: #5e5e5e;
		stroke-width: 2;
		stroke-linejoin: bevel;
		opacity: v-bind('playButton.opacity.play');
		transition:
			all 1s ease,
			opacity 200ms;
	}

	#pause-icon {
		fill: none;
		stroke: #5e5e5e;
		stroke-width: 10;
		stroke-linecap: round;
		opacity: v-bind('playButton.opacity.pause');
		transition:
			all 1s ease,
			opacity 200ms;
	}

	.playButton:hover svg #play-icon {
		fill: #808080;
		stroke: #808080;
	}

	.playButton:hover svg #pause-icon {
		stroke: #808080;
	}

	.playButton:hover {
		background: #e5e4e2;
	}

	.playButton:active {
		transform: translateY(5%);
		box-shadow: 0 3px 5px 2px rgba(0, 0, 0, 0.4);
	}
</style>
