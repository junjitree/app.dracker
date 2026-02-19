<template>
  <q-banner v-if="showBanner" class="bg-accent text-white text-center q-pa-sm">
    <div class="row items-center justify-center q-gutter-x-md">
      <div>Update available!</div>
      <q-btn label="Reload" color="white" text-color="accent" no-caps @click="refreshApp" />
    </div>
  </q-banner>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showBanner = ref(false)
const updateWaiting = ref<ServiceWorker | null>(null)

const refreshApp = () => {
  window.location.reload()
}

onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        if (registration.waiting) {
          updateWaiting.value = registration.waiting
          showBanner.value = true
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                updateWaiting.value = newWorker
                showBanner.value = true
              }
            })
          }
        })
      })
      .catch((err) => {
        console.error(err)
      })
  }
})
</script>
