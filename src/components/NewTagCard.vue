<template>
  <q-card flat class="dr-new-card">
    <q-card-section class="dr-new-card__body">
      <div class="dr-new-card__icon" :style="{ background: `${cat.color}26`, color: cat.color }">
        <q-icon :name="cat.icon" size="24px" />
      </div>

      <div class="dr-new-card__text">
        <!-- NAME -->
        <div
          v-if="!editingName"
          class="dr-new-card__label dr-new-card__label--name"
          @click="editingName = true"
        >
          <span
            class="dr-new-card__labeltext"
            :class="{ 'dr-new-card__labeltext--empty': !name }"
          >
            {{ name || 'Tag name' }}
          </span>
          <q-icon name="edit" size="14px" class="dr-new-card__editicon" />
        </div>
        <q-input
          v-else
          v-model="name"
          dense
          borderless
          autofocus
          placeholder="Tag name"
          maxlength="80"
          class="dr-new-card__name"
          :disable="saving"
          @keyup.enter="editingName = false"
          @blur="editingName = false"
        />

        <!-- DESCRIPTION -->
        <div
          v-if="!editingDesc"
          class="dr-new-card__label dr-new-card__label--desc"
          @click="editingDesc = true"
        >
          <span
            class="dr-new-card__labeltext"
            :class="{ 'dr-new-card__labeltext--empty': !desc }"
          >
            {{ desc || 'Description (optional)' }}
          </span>
          <q-icon name="edit" size="14px" class="dr-new-card__editicon" />
        </div>
        <q-input
          v-else
          v-model="desc"
          dense
          borderless
          autofocus
          placeholder="Description (optional)"
          maxlength="120"
          class="dr-new-card__desc"
          :disable="saving"
          @keyup.enter="editingDesc = false"
          @blur="editingDesc = false"
        />
      </div>

      <q-btn
        flat
        round
        dense
        color="primary"
        icon="save"
        class="dr-new-card__save"
        :loading="saving"
        :disable="!name.trim()"
        @click="create"
      >
        <q-tooltip>Save</q-tooltip>
      </q-btn>
    </q-card-section>

    <q-separator class="dr-new-card__sep" />

    <q-card-section class="dr-new-card__foot">
      <q-skeleton type="text" width="46px" />
      <q-skeleton type="text" width="72px" />
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
const editingName = ref(false);
const editingDesc = ref(false);

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
      editingName.value = false;
      editingDesc.value = false;
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
// the family: dynamic category icon, and click-to-edit name / desc that read
// as the card's text until you click into them.
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

  // resting "label" state: text + a pencil hugging it, i-beam cursor to hint
  // that clicking edits it
  &__label {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    cursor: text;
  }

  &__labeltext {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.35;
  }

  &__label--name &__labeltext {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--dr-text);
  }

  &__label--desc &__labeltext {
    font-size: 13px;
    color: var(--dr-muted);
  }

  &__label--name &__labeltext--empty,
  &__label--desc &__labeltext--empty {
    color: var(--dr-faint);
  }

  &__editicon {
    flex: none;
    color: var(--dr-muted);
  }

  // edit state: strip Quasar's dense-input chrome (fixed 40px height etc.) so
  // the input text lines up exactly with the label it replaced
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

  // save icon sits top-right of the body, where a normal card's ⋯ menu lives
  &__save {
    flex: none;
    align-self: flex-start;
    margin-top: -2px;
  }

  &__sep {
    background: var(--dr-border);
  }

  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
  }
}
</style>
