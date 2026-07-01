<template>
  <q-card flat class="dr-new-card">
    <q-card-section class="dr-new-card__body">
      <div class="dr-new-card__icon" :style="{ background: `${cat.color}26`, color: cat.color }">
        <q-icon :name="cat.icon" size="24px" />
      </div>

      <div class="dr-new-card__text">
        <q-input
          v-model="name"
          dense
          borderless
          placeholder="Tag name"
          maxlength="80"
          class="dr-new-card__name"
          :disable="saving"
          @keyup.enter="create"
        >
          <template #append><q-icon name="edit" size="15px" /></template>
        </q-input>
        <q-input
          v-model="desc"
          dense
          borderless
          placeholder="Description (optional)"
          maxlength="120"
          class="dr-new-card__desc"
          :disable="saving"
          @keyup.enter="create"
        >
          <template #append><q-icon name="edit" size="15px" /></template>
        </q-input>
      </div>
    </q-card-section>

    <q-separator class="dr-new-card__sep" />

    <q-card-section class="dr-new-card__foot">
      <q-btn
        flat
        round
        dense
        color="primary"
        icon="save"
        :loading="saving"
        :disable="!name.trim()"
        @click="create"
      >
        <q-tooltip>Save</q-tooltip>
      </q-btn>
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
// the family: dynamic category icon, borderless inputs (a pencil marks each as
// editable) sized like the card's name / desc, and the save action in footer.
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
    gap: 1px; // matches the tag card's desc margin-top
  }

  // strip all field chrome (Quasar gives the dense native input a fixed 40px
  // height) so only the text remains, sized like the card's name / desc
  &__name :deep(.q-field__control),
  &__desc :deep(.q-field__control),
  &__name :deep(.q-field__control-container),
  &__desc :deep(.q-field__control-container),
  &__name :deep(.q-field__native),
  &__desc :deep(.q-field__native) {
    height: auto;
    min-height: 0;
    padding: 0;
  }

  // pencil after the input marks the field as editable
  &__name :deep(.q-field__append),
  &__desc :deep(.q-field__append) {
    height: auto;
    padding-left: 8px;
    color: var(--dr-muted);
  }

  &__name :deep(input) {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.35;
    color: var(--dr-text);
  }

  &__desc :deep(input) {
    font-size: 13px;
    line-height: 1.35;
    color: var(--dr-muted);
  }

  &__sep {
    background: var(--dr-border);
  }

  &__foot {
    display: flex;
    justify-content: flex-end;
    padding: 4px 12px;
  }
}
</style>
