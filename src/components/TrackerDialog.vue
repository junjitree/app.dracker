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

        <q-separator spaced />

        <q-toggle v-model="data.is_lost" label="Mark as lost" color="negative" />
        <div v-if="data.is_lost" class="dr-tdialog__lost">
          <q-input
            v-model="data.message"
            filled
            type="textarea"
            autogrow
            label="Message to finder (optional)"
            hint="e.g. Reward offered — please call anytime"
          />
          <div class="text-caption text-grey-6">
            Your phone &amp; address from your
            <router-link to="/profile" class="text-primary">profile</router-link>
            are shown to whoever scans this tag while it's lost.
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
import { api } from 'src/boot/axios';
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';

interface Payload {
  name: string;
  desc: string;
  target_url: string | null;
  is_lost: boolean;
  message: string | null;
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

const defaultData = (): Payload => ({
  name: '',
  desc: '',
  target_url: null,
  is_lost: false,
  message: '',
});
const data = ref<Payload>(defaultData());
const loading = ref(false);

const load = async () => {
  if (props.trackerId == null) {
    data.value = defaultData();
    return;
  }
  loading.value = true;
  try {
    const t = (await api.get(`${endpoint}/${props.trackerId}`)).data;
    data.value = {
      name: t.name,
      desc: t.desc,
      target_url: t.target_url ?? null,
      is_lost: t.is_lost ?? false,
      message: t.message ?? '',
    };
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

watch(
  () => props.modelValue,
  (open) => {
    if (open) void load();
  },
);
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

  &__foot {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 4px;
  }
}
</style>
