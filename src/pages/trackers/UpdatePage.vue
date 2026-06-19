<template>
  <q-inner-loading :showing="loading">
    <q-spinner-gears size="10em" color="primary" />
  </q-inner-loading>
  <q-form class="q-gutter-xl" :disable="loading" @submit="onSubmit">
    <div class="row">
      <q-card-section class="text-h4 col-12 q-mt-md">
        {{ isNaN(id) ? 'Add' : 'Edit' }} Tracker
      </q-card-section>

      <div class="col-12 q-pa-md">
        <q-input
          v-model="data.name"
          :disable="disable"
          autofocus
          filled
          label="Name"
          lazy-rules
          :rules="[(val: string) => (val && val.length > 0) || 'Please enter a name']"
        />
      </div>

      <div class="col-12 q-pa-md">
        <q-input v-model="data.desc" :disable="disable" filled label="Desc" type="textarea" />
      </div>

      <div v-if="data.slug" class="col-12 q-pa-md flex flex-center">
        <div ref="qrContainer" style="max-width: 300px; width: 100%" />
      </div>

      <div v-if="data.slug" class="col-12 q-pa-md">
        <q-btn
          color="primary"
          size="lg"
          icon="download"
          label="Download QR CODE"
          class="full-width"
          @click="downloadAsPng"
        />
      </div>

      <div class="col-12 q-mb-md q-pa-md">
        <q-btn
          :disable="loading"
          label="Save"
          size="lg"
          type="submit"
          color="primary"
          class="full-width"
        />
      </div>
    </div>
  </q-form>
</template>
<script setup lang="ts">
import QRCodeStyling from 'qr-code-styling';
import { api } from 'src/boot/axios';
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';

interface Payload {
  slug: string;
  name: string;
  desc: string;
}

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const defaultData: Payload = { slug: '', name: '', desc: '' };

const id = ref(parseInt(route.params.id?.toString() || '0'));
const qrValue = computed(() => `${window.location.protocol}//${window.location.host}/_${data.value.slug}`);
const qrContainer = ref<HTMLElement | null>(null);
const loading = ref(false);
const disable = ref(false);
const data = ref(defaultData);
const endpoint = `/v1/trackers`;

const qrCode = new QRCodeStyling({
  width: 300,
  height: 300,
  shape: 'circle',
  data: '',
  dotsOptions: {
    type: 'rounded',
    color: '#1A365D',
  },
  cornersSquareOptions: {
    type: 'extra-rounded',
    color: '#1A365D',
  },
  cornersDotOptions: {
    color: '#1A365D',
  },
  backgroundOptions: {
    color: '#ffffff',
  },
  qrOptions: {
    errorCorrectionLevel: 'H',
  },
});

const onSubmit = () => {
  loading.value = true;

  const payload: Payload = data.value;
  const req = isNaN(id.value)
    ? api.post(endpoint, payload)
    : api.put(`${endpoint}/${id.value}`, payload);

  req
    .then(async () => {
      $q.notify({ color: 'green', textColor: 'white', message: 'Data saved!', position: 'bottom-right' });
      await router.push(`${endpoint}`);
    })
    .catch((err) => {
      $q.notify({ color: 'red', textColor: 'white', message: err.response.data.msg, position: 'bottom-right' });
    })
    .finally(() => {
      loading.value = false;
    });
};

const downloadAsPng = () => {
  void qrCode.download({ name: `dracker-qr-${data.value.slug || 'export'}`, extension: 'png' });
  $q.notify({ type: 'positive', message: 'Downloading QR code...' });
};

watch(qrValue, (val) => {
  void qrCode.update({ data: val });
});

onMounted(() => {
  if (qrContainer.value) {
    qrCode.append(qrContainer.value);
  }
});

onBeforeMount(async () => {
  if (isNaN(id.value)) return;
  loading.value = true;
  data.value = (await api.get(`${endpoint}/${id.value}`)).data;
  loading.value = false;
});
</script>
