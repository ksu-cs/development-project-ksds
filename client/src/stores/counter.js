import { defineStore } from 'pinia'

export const useWatcherEnumStore = defineStore('watcherType', () => {
  const watcherNames = [
    "onZoomChange",
    "onYearChange"
  ]

  const watcherType = {};

  watcherNames.forEach((value, index) => {
    watcherType[value] = index;
  })

  return watcherType
})
