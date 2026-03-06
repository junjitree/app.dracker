<template>
  <q-inner-loading :showing="loading">
    <q-spinner-gears size="10em" color="primary" />
  </q-inner-loading>
  <q-form class="q-gutter-xl">
    <div class="row">
      <q-card-section class="text-h4 col-12 q-mt-md"> View Ping </q-card-section>

      <div class="col-12 col-md-6 q-pa-md">
        <q-input v-model="tracker.name" readonly autofocus filled label="Tracker" />
      </div>

      <div class="col-12 col-md-6 q-pa-md">
        <q-input v-model="data.created_at" readonly autofocus filled label="Pinged On" />
      </div>

      <div class="col-12 q-pa-md">
        <q-input v-model="data.note" readonly autofocus filled label="Note" type="textarea" />
      </div>

      <div class="col-12 q-pa-md">
        <iframe
          width="100%"
          height="400"
          frameborder="0"
          style="border: 0"
          :src="`https://maps.google.com/maps?q=${data.lat},${data.lon}&z=15&output=embed`"
          allowfullscreen
        />
      </div>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { api } from 'src/boot/axios';
import { onBeforeMount, ref } from 'vue';
import { useRoute } from 'vue-router';

interface Payload {
  id: number;
  tracker_id: number;
  note: string;
  lat: number;
  lon: number;
  created_at: string;
}

interface PayloadTracker {
  id: number;
  name: string;
  desc: string;
}

const defaultData: Payload = {
  id: 0,
  tracker_id: 0,
  note: '',
  lat: 0.0,
  lon: 0.0,
  created_at: '',
};

const defaultTracker: PayloadTracker = {
  id: 0,
  name: '',
  desc: '',
};

const route = useRoute();

const id = ref(parseInt(route.params.id?.toString() || ''));
const loading = ref(false);
const data = ref(defaultData);
const tracker = ref(defaultTracker);

onBeforeMount(async () => {
  loading.value = true;
  data.value = (await api.get(`v1/pings/${id.value}`)).data;
  tracker.value = (await api.get(`v1/trackers/${data.value.tracker_id}`)).data;

  console.log(data.value);
  loading.value = false;
});
</script>
