<template>
  <q-dialog v-model="show" @hide="onHide">
    <q-card class="dr-tdialog">
      <q-card-section class="dr-tdialog__head">
        <div class="text-h6">{{ isEdit ? 'Edit tag' : 'New tag' }}</div>
        <q-btn v-close-popup flat round dense icon="close" />
      </q-card-section>

      <q-separator />

      <q-inner-loading :showing="loading">
        <q-spinner-gears size="6em" color="primary" />
      </q-inner-loading>

      <q-form class="dr-tdialog__body" @submit="onSubmit">
        <q-input
          v-model="data.name"
          filled
          autofocus
          label="Name"
          lazy-rules
          :rules="[(val: string) => (val && val.length > 0) || 'Please enter a name']"
        />

        <q-input v-model="data.desc" filled label="Description" type="textarea" autogrow />

        <q-input
          v-model="data.target_url"
          filled
          clearable
          type="url"
          label="Custom destination (optional)"
          hint="Where this tag redirects when scanned. Leave blank to use the public ping page. Changing it does not require reprinting the QR."
        />

        <!-- QR (only once the tag exists and has a slug) -->
        <div v-if="data.slug" class="dr-tdialog__qr">
          <div class="qr-frame">
            <div
              ref="qrContainer"
              class="qr-disc"
              :style="{
                position: 'absolute',
                inset: ringInset,
                borderRadius: '50%',
                overflow: 'hidden',
                lineHeight: '0',
                background: mesh,
              }"
            />
            <canvas ref="ringCanvas" class="qr-ring" />
          </div>

          <div class="dr-tdialog__qr-actions">
            <q-btn
              outline
              color="secondary"
              icon="shuffle"
              label="Randomize"
              no-caps
              @click="randomizeColors"
            />
            <q-btn
              unelevated
              color="primary"
              icon="download"
              label="Download QR"
              no-caps
              @click="downloadAsPng"
            />
          </div>
        </div>

        <div class="dr-tdialog__foot">
          <q-btn v-close-popup flat label="Cancel" no-caps />
          <q-btn
            unelevated
            color="primary"
            type="submit"
            :label="isEdit ? 'Save' : 'Create tag'"
            no-caps
            :disable="loading"
          />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import QRCodeStyling from 'qr-code-styling';
import { api } from 'src/boot/axios';
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { MESH_CORNERS, meshGradient as meshCss, pickAccents, pickInk } from 'src/composables/palette';

interface Payload {
  slug: string;
  name: string;
  desc: string;
  target_url: string | null;
}

const props = defineProps<{ modelValue: boolean; trackerId: number | null }>();
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: [number] }>();

const $q = useQuasar();
const endpoint = '/v1/trackers';

const show = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});
const isEdit = computed(() => props.trackerId != null);

const defaultData = (): Payload => ({ slug: '', name: '', desc: '', target_url: null });
const data = ref<Payload>(defaultData());
const loading = ref(false);

// --- QR tag geometry (tuned: square QR inscribed in the inner circle) --------
const qrValue = computed(() => {
  const apex = window.location.host.replace(/^app\./, '');
  return `${window.location.protocol}//${apex}/${data.value.slug}`;
});
const qrContainer = ref<HTMLElement | null>(null);
const ringCanvas = ref<HTMLCanvasElement | null>(null);

const QR_SIZE = 280;
const QUIET = (1 - 1 / Math.SQRT2) / 2; // ~0.1464 — corners reach the inner circle
const RING = 28;
const RING_TEXT = 'SCAN TO PING • ';
const BASE_FONT = 15;
const EXPORT_SCALE = 4;
const EXPORT_PAD = 16;
const TOTAL = QR_SIZE + RING * 2;
const ringInset = `${(RING / TOTAL) * 100}%`;

// --- color scheme (shared QR palette) ----------------------------------------
const colors = ref<string[]>(pickAccents());
const ink = ref<string>(pickInk());
const mesh = computed(() => meshCss(colors.value));

// contrast guard so dots stay readable over the lightest mesh spot
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
const contrast = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const pickValidScheme = () => {
  for (let i = 0; i < 60; i++) {
    const cols = pickAccents();
    const k = pickInk();
    const kl = hexLum(k);
    if (cols.every((c) => contrast(kl, hexLum(c)) >= MIN_CONTRAST)) {
      return { colors: cols, ink: k };
    }
  }
  return { colors: pickAccents(), ink: '#16161e' };
};

const drawMeshToCanvas = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  MESH_CORNERS.forEach((c, i) => {
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

const qrOptions = (size: number, value: string) => ({
  width: size,
  height: size,
  type: 'canvas' as const,
  margin: Math.round(size * QUIET),
  data: value,
  dotsOptions: { type: 'rounded' as const, color: ink.value },
  cornersSquareOptions: { type: 'extra-rounded' as const, color: ink.value },
  cornersDotOptions: { color: ink.value },
  backgroundOptions: { color: 'rgba(0,0,0,0)' },
  qrOptions: { errorCorrectionLevel: 'H' as const },
});

const qrCode = new QRCodeStyling(qrOptions(QR_SIZE, ''));

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

// curved call-to-action text around the ring; spacing stretched to close the loop
const drawRingText = (
  ctx: CanvasRenderingContext2D,
  size: number,
  ring: number,
  fontSize: number,
) => {
  const radius = size / 2 - ring / 2;
  const baseSpacing = fontSize / 4;

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
  const extraPerChar = (circumference - naturalWidth) / text.length;

  let angle = -Math.PI / 2;
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
  drawRingText(ctx, TOTAL, RING, BASE_FONT);
};

const buildComposite = (source: CanvasImageSource, qrPx: number, scale: number) => {
  const ring = RING * scale;
  const pad = EXPORT_PAD * scale;
  const inner = QR_SIZE * scale;
  const circle = inner + ring * 2;
  const size = circle + pad * 2;
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return null;

  ctx.translate(pad, pad);

  ctx.save();
  ctx.beginPath();
  ctx.arc(circle / 2, circle / 2, circle / 2 - ring, 0, Math.PI * 2);
  ctx.clip();
  drawMeshToCanvas(ctx, circle);
  const qrOffset = ring + (inner - qrPx) / 2;
  ctx.drawImage(source, qrOffset, qrOffset);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(circle / 2, circle / 2, circle / 2 - ring / 2, 0, Math.PI * 2);
  ctx.strokeStyle = ink.value;
  ctx.lineWidth = ring;
  ctx.stroke();

  drawRingText(ctx, circle, ring, BASE_FONT * scale);
  return offscreen;
};

const downloadAsPng = async () => {
  if (!data.value.slug) return;
  const qrPx = QR_SIZE * EXPORT_SCALE;
  const hiRes = new QRCodeStyling(qrOptions(qrPx, qrValue.value));
  const raw = await hiRes.getRawData('png');
  if (!(raw instanceof Blob)) return;
  const bitmap = await createImageBitmap(raw);

  const offscreen = buildComposite(bitmap, qrPx, EXPORT_SCALE);
  if (!offscreen) return;

  const link = document.createElement('a');
  link.download = `dracker-qr-${data.value.slug || 'export'}.png`;
  link.href = offscreen.toDataURL('image/png');
  link.click();

  $q.notify({
    type: 'positive',
    message: `Downloading QR (${offscreen.width}×${offscreen.height})…`,
  });
};

// --- data lifecycle ----------------------------------------------------------
const load = async () => {
  if (props.trackerId == null) {
    data.value = defaultData();
    return;
  }
  loading.value = true;
  try {
    data.value = (await api.get(`${endpoint}/${props.trackerId}`)).data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const onSubmit = () => {
  loading.value = true;
  const req = isEdit.value
    ? api.put(`${endpoint}/${props.trackerId}`, data.value)
    : api.post(endpoint, data.value);

  req
    .then(({ data: id }) => {
      $q.notify({ color: 'positive', icon: 'check', message: 'Tag saved' });
      emit('saved', isEdit.value ? (props.trackerId as number) : id);
      show.value = false;
    })
    .catch((err) => {
      $q.notify({
        color: 'negative',
        message: err?.response?.data?.msg || 'Could not save tag',
      });
    })
    .finally(() => {
      loading.value = false;
    });
};

const onHide = () => {
  data.value = defaultData();
};

// load whenever the dialog opens
watch(
  () => props.modelValue,
  (open) => {
    if (open) void load();
  },
);

// keep QR canvas in sync
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
</script>

<style scoped lang="scss">
.dr-tdialog {
  width: 100%;
  max-width: 460px;
  border-radius: var(--dr-r-lg);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }

  &__qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 6px 0;
  }

  &__qr-actions {
    display: flex;
    gap: 10px;
    width: 100%;

    .q-btn {
      flex: 1;
    }
  }

  &__foot {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 4px;
  }
}

.qr-frame {
  position: relative;
  width: 100%;
  max-width: 300px;
}

.qr-ring {
  position: relative;
  width: 100%;
  height: auto;
  display: block;
  pointer-events: none;
}

// QR fills the disc; blank quiet-zone corners are clipped by the circle
.qr-frame :deep(.qr-disc canvas) {
  width: 100%;
  height: auto;
  display: block;
}
</style>
