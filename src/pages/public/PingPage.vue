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

  <!-- LOCATING: blank page while the browser's own location prompt is shown -->
  <div v-else-if="locating" class="dr-finder dr-finder--blank" />

  <!-- FINDER -->
  <div v-else class="dr-finder">
    <!-- LOST: owner contact (only when the tag is marked lost) -->
    <div v-if="lost" class="dr-lost">
      <div class="dr-lost__badge"><q-icon name="report" size="30px" /></div>
      <h1 class="dr-lost__title">This item is marked lost</h1>
      <p v-if="info.message" class="dr-lost__msg">“{{ info.message }}”</p>
      <p class="dr-lost__help">Please reach the owner so they can get it back:</p>
      <div class="dr-lost__contact">
        <a v-if="info.contact_phone" :href="`tel:${info.contact_phone}`" class="dr-lost__row">
          <q-icon name="call" size="20px" />
          <span>{{ info.contact_phone }}</span>
        </a>
        <div v-if="info.contact_address" class="dr-lost__row dr-lost__row--static">
          <q-icon name="place" size="20px" />
          <span>{{ info.contact_address }}</span>
        </div>
      </div>
      <q-separator class="dr-lost__sep" />
      <p class="dr-lost__or">You can also share your location below.</p>
    </div>

    <div v-if="!lost" class="dr-finder__badge">
      <q-icon name="my_location" size="36px" />
    </div>

    <h1 v-if="!lost" class="dr-finder__title">You found a tagged item</h1>
    <p v-if="!lost" class="dr-finder__text">
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
        :icon="coords ? 'near_me' : 'location_searching'"
        :label="coords ? 'Share my location' : 'Enable location access'"
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
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

interface PublicInfo {
  name: string;
  is_lost: boolean;
  message: string | null;
  contact_phone: string | null;
  contact_address: string | null;
}

const $q = useQuasar();
const route = useRoute();

const dandoru = ref(false);
const loading = ref(false);
const locationBlocked = ref(false);
const locating = ref(true);
const note = ref('');
const slug = ref(route.params.slug?.toString() || '');
const coords = ref<{ lat: number; lon: number } | null>(null);

const lost = ref(false);
const info = ref<PublicInfo>({
  name: '',
  is_lost: false,
  message: null,
  contact_phone: null,
  contact_address: null,
});

// Fire the browser's native location prompt. While it's pending the page stays
// blank; once the finder answers we render the rest.
function requestLocation() {
  if (!navigator.geolocation) {
    locating.value = false;
    locationBlocked.value = true;
    return;
  }
  locating.value = true;
  locationBlocked.value = false;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      coords.value = { lat: position.coords.latitude, lon: position.coords.longitude };
      locating.value = false;
    },
    (err) => {
      coords.value = null;
      locationBlocked.value = true;
      locating.value = false;
      console.error(err);
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

const onSubmit = () => {
  // No fix yet (blocked/denied) — re-open the browser prompt instead of sending.
  if (!coords.value) {
    requestLocation();
    return;
  }

  loading.value = true;
  api
    .post('v1/ping', {
      slug: slug.value,
      lat: coords.value.lat,
      lon: coords.value.lon,
      note: note.value,
    })
    .then(() => {
      dandoru.value = true;
    })
    .catch((err) => {
      $q.notify({ color: 'negative', message: err.response?.data?.msg || 'Could not send ping' });
    })
    .finally(() => {
      loading.value = false;
    });
};

onMounted(() => {
  // ask for location immediately, before the page renders
  requestLocation();
  api
    .get<PublicInfo>(`v1/ping/${slug.value}`)
    .then(({ data }) => {
      info.value = data;
      lost.value = !!data.is_lost;
    })
    .catch((err) => console.error(err));
});
</script>

<style scoped lang="scss">
.dr-lost {
  text-align: center;
  border: 1px solid var(--dr-border);
  border-radius: var(--dr-r-lg);
  background: var(--dr-surface);
  padding: 24px 20px;
  margin-bottom: 26px;

  &__badge {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    margin: 0 auto 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: linear-gradient(135deg, #f7768e 0%, #ff9e64 100%);
    box-shadow: 0 10px 24px rgba(247, 118, 142, 0.4);
  }

  &__title {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
    color: var(--dr-text);
  }

  &__msg {
    font-style: italic;
    font-size: 15px;
    color: var(--dr-text);
    margin: 0 auto 12px;
    max-width: 34ch;
  }

  &__help {
    font-size: 14px;
    color: var(--dr-muted);
    margin: 0 0 14px;
  }

  &__contact {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: var(--dr-r);
    background: var(--dr-surface-2);
    color: var(--dr-primary);
    font-weight: 700;
    font-size: 16px;
    text-decoration: none;

    &--static {
      color: var(--dr-text);
      font-weight: 600;
      font-size: 15px;
    }
  }

  &__sep {
    margin: 20px 0 12px;
  }

  &__or {
    font-size: 13px;
    color: var(--dr-faint);
    margin: 0;
  }
}

.dr-finder {
  text-align: center;
  padding: 8px 4px 4px;

  // blank holding state while the native location prompt is up
  &--blank {
    min-height: 240px;
  }

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
