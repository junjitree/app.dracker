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

      <div v-if="data.slug" class="col-12 q-pa-md">
        <q-section class="flex flex-center">
          <canvas
            ref="mirrorCanvas"
            style="max-width: 300px; width: 100%; height: auto; cursor: pointer"
            @click="downloadAsPng"
          />

          <qrcode-vue
            id="qrcode"
            :value="qrValue"
            :size="1024"
            level="H"
            render-as="canvas"
            style="display: none"
          />
        </q-section>
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
import QrcodeVue from 'qrcode.vue';
import { api } from 'src/boot/axios';
import { computed, onBeforeMount, ref, watch, onMounted, nextTick } from 'vue';
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

const defaultData: Payload = {
  slug: '',
  name: '',
  desc: '',
};

const id = ref(parseInt(route.params.id?.toString() || '0'));
const qrValue = computed(() => {
  return `http://${window.location.host}/_${data.value.slug}`;
});
const mirrorCanvas = ref<HTMLCanvasElement | null>(null);
const loading = ref(false);
const disable = ref(false);

const data = ref(defaultData);
const endpoint = `/v1/trackers`;

const onSubmit = () => {
  loading.value = true;

  const payload: Payload = data.value;
  let req;

  if (isNaN(id.value)) {
    req = api.post(endpoint, payload);
  } else {
    req = api.put(`${endpoint}/${id.value}`, payload);
  }

  req
    .then(async () => {
      $q.notify({
        color: 'green',
        textColor: 'white',
        message: 'Data saved!',
        position: 'bottom-right',
      });

      await router.push(`${endpoint}`);
    })
    .catch((err) => {
      $q.notify({
        color: 'red',
        textColor: 'white',
        message: err.response.data.msg,
        position: 'bottom-right',
      });
    })
    .finally(() => {
      loading.value = false;
    });
};

const drawCanvas = async () => {
  await nextTick();

  const canvas = mirrorCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = 1024;
  canvas.width = size;
  canvas.height = size;
  const center = size / 2;

  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(center, center, 490, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  ctx.strokeStyle = '#1A365D';
  ctx.lineWidth = 32;
  ctx.stroke();

  const qrSource = document.querySelector('canvas#qrcode') as HTMLCanvasElement;
  if (qrSource) {
    const qrDrawSize = 650;
    ctx.drawImage(
      qrSource,
      center - qrDrawSize / 2,
      center - qrDrawSize / 2,
      qrDrawSize,
      qrDrawSize,
    );
  }

  ctx.font = 'bold 50px Arial';
  ctx.fillStyle = '#1A365D';
  ctx.textAlign = 'center';
  ctx.fillText('DRACKER', center, center + 380);
};

const downloadAsPng = () => {
  const canvas = mirrorCanvas.value;
  if (!canvas) return;

  const pngUrl = canvas.toDataURL('image/png');
  const downloadLink = document.createElement('a');
  downloadLink.download = `dracker-qr-${data.value.slug || 'export'}.png`;
  downloadLink.href = pngUrl;
  downloadLink.click();

  $q.notify({ type: 'positive', message: 'Image exported exactly as shown!' });
};

watch(qrValue, async () => {
  await drawCanvas();
});

onMounted(async () => {
  await drawCanvas();
});

onBeforeMount(async () => {
  if (isNaN(id.value)) {
    return;
  }

  loading.value = true;
  data.value = (await api.get(`${endpoint}/${id.value}`)).data;
  loading.value = false;
});
</script>
