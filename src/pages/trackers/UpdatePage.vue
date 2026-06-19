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

      <div v-if="data.slug" class="col-12 q-pa-md column flex-center">
        <div
          ref="qrContainer"
          :style="{
            maxWidth: '300px',
            width: '100%',
            borderRadius: '50%',
            border: '8px solid #1A365D',
            overflow: 'hidden',
            lineHeight: '0',
            background: meshGradient,
          }"
        />
        <div class="row items-center q-gutter-xs q-mt-md text-grey-6 text-caption">
          <q-icon name="photo_camera" size="18px" />
          <span class="text-uppercase" style="letter-spacing: 1px">Scan to ping</span>
        </div>
      </div>

      <div v-if="data.slug" class="col-12 q-pa-md">
        <q-btn
          color="secondary"
          size="lg"
          icon="shuffle"
          label="Randomize Colors"
          class="full-width q-mb-md"
          @click="randomizeColors"
        />
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
import { computed, onBeforeMount, ref, watch } from 'vue';
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
const qrValue = computed(
  () => `${window.location.protocol}//${window.location.host}/_${data.value.slug}`,
);
const qrContainer = ref<HTMLElement | null>(null);
const loading = ref(false);
const disable = ref(false);
const data = ref(defaultData);
const endpoint = `/v1/trackers`;

const corners = [
  { x: 0.15, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.85, y: 0.85 },
  { x: 0.15, y: 0.85 },
];

// Tokyo Night accent palette
const tokyoNight = [
  '#7aa2f7', // blue
  '#7dcfff', // cyan
  '#bb9af7', // purple
  '#f7768e', // red/magenta
  '#9ece6a', // green
  '#ff9e64', // orange
  '#e0af68', // yellow
  '#2ac3de', // teal
];

const pickTokyoColors = () => {
  const pool = [...tokyoNight].sort(() => Math.random() - 0.5);
  return corners.map((_, i) => pool[i % pool.length] as string);
};

const colors = ref<string[]>(pickTokyoColors());

// mesh gradient: 4 radial spots at corners blending together
const meshGradient = computed(() =>
  [
    ...corners.map(
      (c, i) =>
        `radial-gradient(circle at ${c.x * 100}% ${c.y * 100}%, ${colors.value[i]}, transparent 60%)`,
    ),
    'white',
  ].join(', '),
);

const randomizeColors = () => {
  colors.value = pickTokyoColors();
};

const drawMeshToCanvas = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  corners.forEach((c, i) => {
    const grad = ctx.createRadialGradient(
      c.x * size,
      c.y * size,
      0,
      c.x * size,
      c.y * size,
      size * 0.65,
    );
    grad.addColorStop(0, colors.value[i] ?? '#ffffff');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  });
};

const qrCode = new QRCodeStyling({
  width: 300,
  height: 300,
  type: 'canvas',
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
    color: 'rgba(0,0,0,0)',
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

const downloadAsPng = () => {
  const source = qrContainer.value?.querySelector('canvas');
  if (!source) return;

  const borderWidth = 8;
  const size = source.width + borderWidth * 2;
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return;

  // clip to circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - borderWidth, 0, Math.PI * 2);
  ctx.clip();

  // draw mesh gradient background
  drawMeshToCanvas(ctx, size);

  // draw QR (transparent bg) on top
  ctx.drawImage(source, borderWidth, borderWidth);

  ctx.restore();

  // border ring
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - borderWidth / 2, 0, Math.PI * 2);
  ctx.strokeStyle = '#1A365D';
  ctx.lineWidth = borderWidth;
  ctx.stroke();

  const link = document.createElement('a');
  link.download = `dracker-qr-${data.value.slug || 'export'}.png`;
  link.href = offscreen.toDataURL('image/png');
  link.click();

  $q.notify({ type: 'positive', message: 'Downloading QR code...' });
};

watch(qrValue, (val) => {
  void qrCode.update({ data: val });
});

watch(qrContainer, (el) => {
  if (el) {
    qrCode.append(el);
    void qrCode.update({ data: qrValue.value });
  }
});

onBeforeMount(async () => {
  if (isNaN(id.value)) return;
  loading.value = true;
  data.value = (await api.get(`${endpoint}/${id.value}`)).data;
  loading.value = false;
});
</script>
