<template>
  <!-- BLANK: cover the whole layout while the browser asks for location and
       while the location is being sent -->
  <div v-if="locating || sending" class="dr-blank" />

  <!-- RESULT -->
  <div v-else class="dr-finder">
    <div class="dr-finder__badge" :class="{ 'dr-finder__badge--ok': sent }">
      <q-icon :name="sent ? 'check' : 'location_off'" size="38px" />
    </div>

    <h1 class="dr-finder__title">{{ sent ? 'Location shared' : 'Location needed' }}</h1>
    <p class="dr-finder__text">
      <template v-if="sent"
        >The owner has been notified of where this item is right now.</template
      >
      <template v-else
        >Allow location access so the owner can be told where their item is. Nothing is posted
        publicly.</template
      >
    </p>

    <!-- LOST: how to reach the owner -->
    <div v-if="lost" class="dr-lost">
      <div class="dr-lost__badge"><q-icon name="report" size="30px" /></div>
      <h2 class="dr-lost__title">This item is marked lost</h2>
      <p v-if="info.message" class="dr-lost__msg">“{{ info.message }}”</p>
      <p class="dr-lost__help">Reach the owner so they can get it back:</p>
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
    </div>

    <!-- BLOCKED: let them re-open the location prompt -->
    <q-btn
      v-if="!sent"
      unelevated
      size="lg"
      color="primary"
      class="dr-finder__cta full-width"
      icon="location_searching"
      label="Enable location access"
      no-caps
      @click="requestLocation"
    />

    <!-- SENT: optional note so the finder can leave their phone / a meetup spot -->
    <template v-if="sent">
      <q-form v-if="!noteSent" class="dr-finder__form" @submit="sendNote">
        <div class="dr-finder__field">
          <div class="dr-finder__label">Add your phone or a meetup spot (optional)</div>
          <q-input
            v-model="note"
            outlined
            type="textarea"
            autogrow
            placeholder="e.g. 0917 123 4567 · meet at the café"
            :disable="noteLoading"
          />
        </div>
        <q-btn
          type="submit"
          unelevated
          size="lg"
          color="primary"
          class="dr-finder__cta full-width"
          icon="add_comment"
          label="Send note"
          no-caps
          :loading="noteLoading"
          :disable="!note.trim()"
        />
      </q-form>
      <p v-else class="dr-finder__credit">Note sent — thank you!</p>
      <p class="dr-finder__credit">You can close this page.</p>
    </template>
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

const slug = ref(route.params.slug?.toString() || '');

const locating = ref(true);
const sending = ref(false);
const sent = ref(false);
const coords = ref<{ lat: number; lon: number } | null>(null);
const pingId = ref<number | null>(null);

const note = ref('');
const noteLoading = ref(false);
const noteSent = ref(false);

const lost = ref(false);
const info = ref<PublicInfo>({
  name: '',
  is_lost: false,
  message: null,
  contact_phone: null,
  contact_address: null,
});

// Fire the browser's native location prompt. The page stays blank until the
// finder answers; once we have a fix we send the ping straight away.
function requestLocation() {
  if (!navigator.geolocation) {
    locating.value = false;
    return;
  }
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      coords.value = { lat: position.coords.latitude, lon: position.coords.longitude };
      locating.value = false;
      sendPing();
    },
    (err) => {
      coords.value = null;
      locating.value = false;
      console.error(err);
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

// The location ping always goes first (no note), so the owner gets it even if
// the finder adds nothing more.
function sendPing() {
  if (!coords.value) return;
  sending.value = true;
  api
    .post<number>('v1/ping', {
      slug: slug.value,
      lat: coords.value.lat,
      lon: coords.value.lon,
      note: '',
    })
    .then(({ data }) => {
      pingId.value = data;
      sent.value = true;
    })
    .catch((err) => {
      $q.notify({ color: 'negative', message: err.response?.data?.msg || 'Could not share location' });
    })
    .finally(() => {
      sending.value = false;
    });
}

// Optional follow-up: attach the finder's note to the ping just created.
function sendNote() {
  if (pingId.value == null || !note.value.trim()) {
    noteSent.value = true;
    return;
  }
  noteLoading.value = true;
  api
    .put(`v1/ping/${pingId.value}/note`, { note: note.value.trim() })
    .then(() => {
      noteSent.value = true;
    })
    .catch((err) => {
      $q.notify({ color: 'negative', message: err.response?.data?.msg || 'Could not add note' });
    })
    .finally(() => {
      noteLoading.value = false;
    });
}

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
}

// Full-viewport blank cover shown while the native location prompt is up,
// hiding the layout's card/logo so the page reads as truly blank.
.dr-blank {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: var(--dr-bg);
}

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
    box-shadow: 0 12px 28px rgba(122, 162, 247, 0.4);

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

  &__label {
    font-size: 14px;
    font-weight: 600;
    color: var(--dr-text);
    margin-bottom: 8px;
    text-align: left;
  }

  &__cta {
    height: 56px;
    font-size: 16px;
    border-radius: var(--dr-r);
  }

  &__credit {
    font-size: 13px;
    color: var(--dr-faint);
    margin: 10px 0 0;
  }
}
</style>
