<template>
  <q-card flat class="dr-new-card">
    <q-card-section class="dr-new-card__body">
      <div class="dr-new-card__icon" :style="{ background: `${cat.color}26`, color: cat.color }">
        <q-icon :name="cat.icon" size="24px" />
      </div>

      <div class="dr-new-card__text">
        <q-input
          v-model="name"
          outlined
          dense
          label="New tag name"
          maxlength="80"
          class="dr-new-card__field"
          :disable="saving"
          @keyup.enter="create"
        />
        <q-input
          v-model="desc"
          outlined
          dense
          label="Description (optional)"
          maxlength="120"
          class="dr-new-card__field"
          :disable="saving"
          @keyup.enter="create"
        />
      </div>
    </q-card-section>

    <q-separator class="dr-new-card__sep" />

    <q-card-section class="dr-new-card__foot">
      <q-btn
        unelevated
        dense
        color="primary"
        icon="check"
        label="Create tag"
        no-caps
        :loading="saving"
        :disable="!name.trim()"
        @click="create"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { api } from 'src/boot/axios';
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { categoryFor } from 'src/composables/category';

const emit = defineEmits<{ created: [number] }>();

const $q = useQuasar();

const name = ref('');
const desc = ref('');
const saving = ref(false);

// preview the icon the saved tag will get, updating as you type
const cat = computed(() => categoryFor(name.value, desc.value));

const create = () => {
  const n = name.value.trim();
  if (!n || saving.value) return;
  saving.value = true;
  api
    .post('/v1/trackers', {
      name: n,
      desc: desc.value.trim(),
      target_url: null,
      is_lost: false,
      message: '',
    })
    .then(({ data: id }) => {
      $q.notify({ color: 'positive', icon: 'check', message: 'Tag created' });
      name.value = '';
      desc.value = '';
      emit('created', id);
    })
    .catch((err) => {
      $q.notify({ color: 'negative', message: err?.response?.data?.msg || 'Could not create tag' });
    })
    .finally(() => {
      saving.value = false;
    });
};
</script>

<style scoped lang="scss">
// Mirrors TrackerCard's chrome so the create card sits in the list as one of
// the family: dynamic category icon on the left, labelled inputs, and the
// save action in the footer where the slug/time normally live.
.dr-new-card {
  border: 1px solid var(--dr-border);
  border-radius: var(--dr-r-lg);
  overflow: hidden;
  background: var(--dr-surface);
  box-shadow: var(--dr-shadow-sm);

  &__body {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.16s ease,
      color 0.16s ease;
  }

  &__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  // trim the default dense field height so the inputs aren't so tall
  &__field :deep(.q-field__control) {
    min-height: 36px;
  }

  &__field :deep(.q-field__control::before) {
    border-color: var(--dr-border);
  }

  &__sep {
    background: var(--dr-border);
  }

  &__foot {
    display: flex;
    justify-content: flex-end;
    padding: 10px 16px;
  }
}
</style>
