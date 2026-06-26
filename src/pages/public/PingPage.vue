<template>
  <!-- SUCCESS -->
  <div v-if="dandoru" class="dr-finder dr-finder--done">
    <div class="dr-finder__badge dr-finder__badge--ok">
      <q-icon name="check" size="40px" />
    </div>
    <h1 class="dr-finder__title">Location shared</h1>
    <p class="dr-finder__text">
      Thank you for helping! The owner has been notified of where this item is right now.
    </p>
    <p class="dr-finder__credit">You can close this page.</p>
  </div>

  <!-- FINDER -->
  <div v-else class="dr-finder">
    <div class="dr-finder__badge">
      <q-icon name="my_location" size="36px" />
    </div>

    <h1 class="dr-finder__title">You found a tagged item</h1>
    <p class="dr-finder__text">
      Share where you are right now so the owner can come and recover it. Your location is sent
      <strong>only to them</strong> — nothing is posted publicly.
    </p>

    <q-form class="dr-finder__form" @submit="onSubmit">
      <q-input
        v-model="note"
        outlined
        type="textarea"
        autogrow
        bg-color="white"
        label="Add a note for the owner (optional)"
        :disable="loading"
      />

      <q-banner v-if="locationBlocked" rounded class="dr-finder__alert">
        <template #avatar><q-icon name="location_off" color="warning" size="28px" /></template>
        <strong>Location is blocked.</strong> Enable location sharing in your browser settings, then
        refresh this page to send your position.
      </q-banner>

      <q-btn
        type="submit"
        unelevated
        size="lg"
        color="primary"
        class="dr-finder__cta full-width"
        icon="near_me"
        label="Share my location"
        no-caps
        :loading="loading"
      />

      <p class="dr-finder__hint">
        <q-icon name="lock" size="14px" /> Your location is used once, just for this report.
      </p>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const $q = useQuasar();
const route = useRoute();

const dandoru = ref(false);
const loading = ref(false);
const locationBlocked = ref(false);
const note = ref('');
const slug = ref(route.params.slug?.toString() || '');

const onSubmit = () => {
  if (!navigator.geolocation) {
    $q.notify({ color: 'negative', message: 'Geolocation not supported on this device' });
    return;
  }

  loading.value = true;
  locationBlocked.value = false;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      api
        .post('v1/ping', {
          slug: slug.value,
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          note: note.value,
        })
        .then(() => {
          dandoru.value = true;
        })
        .catch((err) => {
          $q.notify({
            color: 'negative',
            message: err.response?.data?.msg || 'Could not send ping',
          });
        })
        .finally(() => {
          loading.value = false;
        });
    },
    (err) => {
      loading.value = false;
      locationBlocked.value = true;
      $q.notify({ color: 'negative', message: `Location error: ${err.message}` });
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
};
</script>

<style scoped lang="scss">
.dr-finder {
  text-align: center;
  padding: 8px 4px 4px;

  &__badge {
    width: 88px;
    height: 88px;
    border-radius: 28px;
    margin: 0 auto 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: var(--dr-gradient);
    box-shadow: 0 12px 28px rgba(79, 110, 247, 0.4);

    &--ok {
      background: linear-gradient(135deg, #16b981 0%, #5fe3b3 100%);
      box-shadow: 0 12px 28px rgba(22, 185, 129, 0.4);
    }
  }

  &__title {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
    margin: 0 0 12px;
    color: var(--dr-text);
  }

  &__text {
    font-size: 15.5px;
    line-height: 1.55;
    color: var(--dr-muted);
    margin: 0 auto 26px;
    max-width: 34ch;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    text-align: left;
  }

  &__alert {
    background: #fff7ed;
    color: #9a3412;
    border: 1px solid #fed7aa;
    border-radius: var(--dr-r);
  }

  &__cta {
    height: 56px;
    font-size: 16px;
    border-radius: var(--dr-r);
  }

  &__hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12.5px;
    color: var(--dr-faint);
    margin: 2px 0 0;
  }

  &__credit {
    font-size: 13px;
    color: var(--dr-faint);
    margin: 4px 0 0;
  }
}
</style>
