<template>
  <q-card flat class="dr-new-card">
    <q-card-section class="dr-new-card__body">
      <div class="dr-new-card__icon">
        <q-icon name="add" size="24px" />
      </div>

      <div class="dr-new-card__text">
        <q-input
          v-model="name"
          dense
          borderless
          placeholder="New tag name"
          maxlength="80"
          class="dr-new-card__name"
          :disable="saving"
          @keyup.enter="create"
        />
        <q-input
          v-model="desc"
          dense
          borderless
          placeholder="Description (optional)"
          maxlength="120"
          class="dr-new-card__desc"
          :disable="saving"
          @keyup.enter="create"
        />
      </div>

      <q-btn
        round
        dense
        unelevated
        color="primary"
        icon="check"
        class="dr-new-card__go"
        :loading="saving"
        :disable="!name.trim()"
        @click="create"
      >
        <q-tooltip>Create tag</q-tooltip>
      </q-btn>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { api } from 'src/boot/axios';
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const emit = defineEmits<{ created: [number] }>();

const $q = useQuasar();

const name = ref('');
const desc = ref('');
const saving = ref(false);

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
// the family; the + icon and inline inputs mark it as the "add" card.
.dr-new-card {
  border: 1px solid var(--dr-border);
  border-radius: var(--dr-r-lg);
  background: var(--dr-surface);
  box-shadow: var(--dr-shadow-sm);
  transition: border-color 0.16s ease;

  &:focus-within {
    border-color: var(--dr-primary);
  }

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
    background: var(--dr-primary-soft);
    color: var(--dr-primary);
  }

  &__text {
    flex: 1;
    min-width: 0;
  }

  &__go {
    flex: none;
    align-self: center;
  }

  // seamless inline inputs, sized to match a tag card's name / desc
  :deep(.q-field__control) {
    min-height: unset;
    padding: 0;
  }

  &__name :deep(input) {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--dr-text);
    padding: 2px 0;
  }

  &__desc :deep(input) {
    font-size: 13px;
    color: var(--dr-muted);
    padding: 1px 0;
  }
}
</style>
