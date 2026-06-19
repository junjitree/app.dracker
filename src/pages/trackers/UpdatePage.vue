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

      <div class="col-12 q-pa-md">
        <q-input
          v-model="data.target_url"
          :disable="disable"
          filled
          clearable
          type="url"
          label="Custom destination (optional)"
          hint="Where this tag redirects when scanned. Leave blank to use the public ping page. Changing it does not require reprinting the QR."
        />
      </div>

      <div v-if="data.slug" class="col-12 q-pa-md flex flex-center">
        <div class="qr-frame" style="position: relative; width: 100%; max-width: 360px">
          <div
            ref="qrContainer"
            :style="{
              position: 'absolute',
              inset: ringInset,
              borderRadius: '50%',
              overflow: 'hidden',
              lineHeight: '0',
              background: meshGradient,
            }"
          />
          <canvas
            ref="ringCanvas"
            style="
              position: relative;
              width: 100%;
              height: auto;
              display: block;
              pointer-events: none;
            "
          />
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

      <div v-if="data.slug" class="col-12 q-pa-md">
        <q-card flat bordered>
          <q-card-section class="row items-center q-py-sm">
            <q-icon name="qr_code_scanner" size="sm" class="q-mr-sm" />
            <div class="text-subtitle1">
              {{ scans.length }} scan{{ scans.length === 1 ? '' : 's' }}
            </div>
            <q-space />
            <div v-if="lastScanAt" class="text-caption text-grey-6">Last: {{ lastScanAt }}</div>
          </q-card-section>
          <q-list v-if="scans.length" dense separator>
            <q-item v-for="s in scans.slice(0, 8)" :key="s.id">
              <q-item-section>
                <q-item-label>{{ new Date(s.created_at).toLocaleString() }}</q-item-label>
                <q-item-label caption>{{ s.ip || 'unknown IP' }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <q-card-section v-else class="text-caption text-grey-6 q-pt-none">
            No scans yet.
          </q-card-section>
        </q-card>
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
import jsQR from 'jsqr';
import { api } from 'src/boot/axios';
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';

interface Payload {
  slug: string;
  name: string;
  desc: string;
  target_url: string | null;
}

interface Scan {
  id: number;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const defaultData: Payload = { slug: '', name: '', desc: '', target_url: null };
const scans = ref<Scan[]>([]);
const lastScanAt = computed(() =>
  scans.value[0] ? new Date(scans.value[0].created_at).toLocaleString() : '',
);

const id = ref(parseInt(route.params.id?.toString() || '0'));
// encode the short, stable tag URL (apex domain, e.g. dracker.sh/<slug>) which
// the server resolves/redirects — keeps the QR small and reprint-proof.
const qrValue = computed(() => {
  const apex = window.location.host.replace(/^app\./, '');
  return `${window.location.protocol}//${apex}/${data.value.slug}`;
});
const qrContainer = ref<HTMLElement | null>(null);
const ringCanvas = ref<HTMLCanvasElement | null>(null);
const loading = ref(false);
const disable = ref(false);
const data = ref(defaultData);
const endpoint = `/v1/trackers`;

// navy ring carrying the "scan" call-to-action text
const RING = 30; // ring width in native canvas px (qr is 300 -> total 360)
const RING_TEXT = 'SCAN TO PING • ';
const TOTAL = 300 + RING * 2; // 360 native canvas size incl. ring
const ringInset = `${(RING / TOTAL) * 100}%`;

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

// dark "ink" palette for QR dots + ring (must stay high-contrast on light mesh)
const inkPalette = [
  '#1a365d', // navy
  '#24283b', // tokyo storm
  '#3d59a1', // tokyo dark blue
  '#16161e', // tokyo deep
  '#414868', // tokyo grey-blue
  '#532b88', // deep purple
  '#7a1f4d', // deep magenta
  '#1b4332', // deep green
];

const pickInk = () => inkPalette[Math.floor(Math.random() * inkPalette.length)] as string;

// --- contrast helpers (WCAG) so dots stay readable over any mesh spot ---
const MIN_CONTRAST = 4.5;

const srgbToLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const relLuminance = (r: number, g: number, b: number) =>
  0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);

const hexLum = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return relLuminance((n >> 16) & 255, (n >> 8) & 255, n & 255);
};

// parse "hsl(h, s%, l%)" -> relative luminance
const hslLum = (str: string) => {
  const m = str.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/);
  if (!m) return 1;
  const h = Number(m[1]) / 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const hue = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return relLuminance(hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255);
};

const contrast = (lumA: number, lumB: number) =>
  (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);

// pick mesh colors + ink so every dot keeps >= MIN_CONTRAST against its
// background (white center and each corner spot). Falls back to darkest ink.
const pickValidScheme = () => {
  for (let i = 0; i < 60; i++) {
    const cols = pickTokyoColors();
    const k = pickInk();
    const kl = hexLum(k);
    if (cols.every((c) => contrast(kl, hslLum(c)) >= MIN_CONTRAST)) {
      return { colors: cols, ink: k };
    }
  }
  return { colors: pickTokyoColors(), ink: '#16161e' };
};

const initial = pickValidScheme();
const colors = ref<string[]>(initial.colors);
const ink = ref<string>(initial.ink);

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
  const scheme = pickValidScheme();
  colors.value = scheme.colors;
  ink.value = scheme.ink;
  void qrCode.update({
    dotsOptions: { type: 'rounded', color: ink.value },
    cornersSquareOptions: { type: 'extra-rounded', color: ink.value },
    cornersDotOptions: { color: ink.value },
  });
  if (ringCanvas.value) renderRing(ringCanvas.value);
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
  margin: 10, // quiet zone so the ring/mesh never crowds the finder pattern
  data: '',
  dotsOptions: {
    type: 'rounded',
    color: ink.value,
  },
  cornersSquareOptions: {
    type: 'extra-rounded',
    color: ink.value,
  },
  cornersDotOptions: {
    color: ink.value,
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

// draw the call-to-action text curved evenly around the full ring.
// fits a whole number of phrase repeats and stretches spacing so the
// loop closes seamlessly (no cut-off / overlap at the seam).
const drawRingText = (ctx: CanvasRenderingContext2D, size: number) => {
  const radius = size / 2 - RING / 2;
  const fontSize = 16;
  const baseSpacing = 4;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(size / 2, size / 2);

  const advance = (ch: string) => ctx.measureText(ch).width + baseSpacing;
  const unitWidth = [...RING_TEXT].reduce((w, ch) => w + advance(ch), 0);
  const circumference = 2 * Math.PI * radius;
  const reps = Math.max(1, Math.round(circumference / unitWidth));
  const text = RING_TEXT.repeat(reps);
  const naturalWidth = [...text].reduce((w, ch) => w + advance(ch), 0);
  // distribute the leftover (or overflow) evenly across every glyph
  const extraPerChar = (circumference - naturalWidth) / text.length;

  let angle = -Math.PI / 2; // start at top
  for (const ch of text) {
    const charAngle = (advance(ch) + extraPerChar) / radius;
    ctx.save();
    ctx.rotate(angle + charAngle / 2);
    ctx.translate(0, -radius);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += charAngle;
  }
  ctx.restore();
};

// render the navy ring + curved text onto a transparent overlay canvas
const renderRing = (canvas: HTMLCanvasElement) => {
  canvas.width = TOTAL;
  canvas.height = TOTAL;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, TOTAL, TOTAL);
  ctx.beginPath();
  ctx.arc(TOTAL / 2, TOTAL / 2, TOTAL / 2 - RING / 2, 0, Math.PI * 2);
  ctx.strokeStyle = ink.value;
  ctx.lineWidth = RING;
  ctx.stroke();
  drawRingText(ctx, TOTAL);
};

// composite the full tag (mesh + QR + ring + text) onto one canvas
const buildComposite = (source: HTMLCanvasElement) => {
  const size = source.width + RING * 2;
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return null;

  // clip to inner circle for mesh + QR
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - RING, 0, Math.PI * 2);
  ctx.clip();

  drawMeshToCanvas(ctx, size);
  ctx.drawImage(source, RING, RING);
  ctx.restore();

  // navy ring
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - RING / 2, 0, Math.PI * 2);
  ctx.strokeStyle = ink.value;
  ctx.lineWidth = RING;
  ctx.stroke();

  drawRingText(ctx, size);
  return offscreen;
};

// integrity gate: confirm the finished artifact actually decodes to our URL
const decodesToUrl = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(img.data, img.width, img.height);
  return result?.data === qrValue.value;
};

const downloadAsPng = () => {
  const source = qrContainer.value?.querySelector('canvas');
  if (!source) return;

  const offscreen = buildComposite(source);
  if (!offscreen) return;

  if (!decodesToUrl(offscreen)) {
    $q.notify({
      type: 'negative',
      message: 'QR failed integrity check — not downloaded. Try Randomize Colors.',
      position: 'bottom-right',
    });
    return;
  }

  const link = document.createElement('a');
  link.download = `dracker-qr-${data.value.slug || 'export'}.png`;
  link.href = offscreen.toDataURL('image/png');
  link.click();

  $q.notify({ type: 'positive', message: 'QR verified — downloading...' });
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

watch(ringCanvas, (el) => {
  if (el) renderRing(el);
});

onBeforeMount(async () => {
  if (isNaN(id.value)) return;
  loading.value = true;
  data.value = (await api.get(`${endpoint}/${id.value}`)).data;
  scans.value = (await api.get(`${endpoint}/${id.value}/scans`)).data;
  loading.value = false;
});
</script>

<style scoped>
.qr-frame :deep(canvas) {
  width: 100%;
  height: auto;
  display: block;
}
</style>
