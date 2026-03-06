<template>
  <q-form v-if="!dandoru" class="q-gutter-md" @submit="onSubmit">
    <p class="text-center">Broadcast your current GPS position and attach a short memo.</p>
    <q-input
      v-model="note"
      autofocus
      outlined
      type="textarea"
      label="Add a note (optional)"
      :disable="loading"
    />

    <q-banner
      v-if="locationBlocked"
      inline-actions
      rounded
      class="bg-orange-1 text-orange-9 border-orange q-pl-none"
    >
      <div class="row">
        <div class="col-2 flex flex-center">
          <q-icon name="location_off" color="orange-9" size="xl" />
        </div>
        <div class="col-10">
          <strong>Location Access Blocked</strong><br />
          It looks like you've disabled location sharing. To send your ping, please enable location
          permissions in your browser settings and refresh the page.
        </div>
      </div>
    </q-banner>

    <div class="q-mb-md">
      <q-btn
        label="Submit Tracker Location"
        size="lg"
        type="submit"
        color="primary"
        class="full-width"
        :disable="loading"
      />
    </div>
  </q-form>

  <q-banner
    v-if="dandoru"
    inline-actions
    rounded
    class="bg-green-1 text-green-9 border-green q-pl-none"
  >
    <div class="row">
      <div class="col-2 flex flex-center">
        <q-icon name="location_on" color="green-9" size="xl" />
      </div>
      <div class="col-10">
        <strong>Ping sent!</strong><br />
        Your ping has been sent to the owner of this tracker, thanks for the help!
      </div>
    </div>
  </q-banner>
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
    $q.notify({ color: 'negative', message: 'Geolocation not supported' });
    return;
  }

  $q.notify({ color: 'positive', message: 'Fetching coordinates' });

  navigator.geolocation.getCurrentPosition(
    (position) => {
      $q.notify({ color: 'positive', message: 'Coordinates fetched' });
      api
        .post('v1/ping', {
          slug: slug.value,
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          note: note.value,
        })
        .then(() => {
          dandoru.value = true;
          $q.notify({ color: 'positive', message: 'Ping sent, Thanks' });
        })
        .catch((err) => {
          $q.notify({ color: 'negative', message: err.response.data.msg });
        });
    },
    (err) => {
      locationBlocked.value = true;
      $q.notify({ color: 'negative', message: `Error: ${err.message}` });
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
};
</script>
