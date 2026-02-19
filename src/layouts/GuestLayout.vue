<template>
  <UpdateBanner />
  <q-layout>
    <q-page-container>
      <q-page class="row flex-center">
        <q-card
          :class="{
            'flex-center': $q.screen.lt.sm,
            'q-card-small': $q.screen.gt.xs,
            'q-pa-lg': true,
            flex: $q.screen.lt.sm,
            fullscreen: $q.screen.lt.sm,
          }"
        >
          <div class="login-inner">
            <div class="text-center q-mb-xl">
              <img :alt="appName" src="~assets/logo.svg" width="20%" />
            </div>
            <router-view />
          </div>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import UpdateBanner from 'components/UpdateBanner.vue'
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const appName = ref(process.env.APP_NAME)
const $q = useQuasar()
</script>

<style scoped>
.q-card,
.login-inner {
  width: 100%;
  max-width: 40em;
}
</style>
