<template>
  <UpdateBanner />
  <q-layout>
    <q-page-container>
      <q-page class="dr-guest">
        <div class="dr-guest__card">
          <div class="dr-guest__brand">
            <img :alt="appName" src="~assets/logo.svg" width="44" height="44" />
            <span class="dr-guest__name">{{ appName }}</span>
          </div>
          <router-view />
        </div>
        <p class="dr-guest__foot">Lost &amp; found for anything — one scan away.</p>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import UpdateBanner from 'components/UpdateBanner.vue';
import { ref } from 'vue';

const appName = ref(process.env.APP_NAME);
</script>

<style scoped lang="scss">
.dr-guest {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(820px 520px at 12% -8%, rgba(122, 162, 247, 0.16), transparent 58%),
    radial-gradient(720px 480px at 92% 4%, rgba(187, 154, 247, 0.14), transparent 58%),
    radial-gradient(760px 520px at 88% 108%, rgba(125, 207, 255, 0.12), transparent 60%),
    radial-gradient(680px 500px at 8% 104%, rgba(158, 206, 106, 0.09), transparent 60%),
    var(--dr-bg);

  &__card {
    width: 100%;
    max-width: 30em;
    background: var(--dr-surface);
    border: 1px solid var(--dr-border);
    border-radius: var(--dr-r-lg);
    box-shadow: var(--dr-shadow-lg);
    padding: 36px 32px;

    @media (max-width: 599px) {
      padding: 28px 22px;
      box-shadow: var(--dr-shadow);
    }
  }

  &__brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 28px;
  }

  &__name {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--dr-text);
  }

  &__foot {
    margin-top: 22px;
    font-size: 13px;
    color: var(--dr-faint);
  }
}
</style>
