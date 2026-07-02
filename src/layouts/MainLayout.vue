<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="dr-header">
      <q-toolbar class="dr-toolbar">
        <router-link to="/trackers" class="dr-brand">
          <img src="~assets/logo.svg" alt="Dracker" width="36" height="36" />
          <span class="dr-brand__name">{{ appName }}</span>
        </router-link>

        <q-space />

        <q-select
          v-model="theme"
          :options="themeOptions"
          dense
          borderless
          emit-value
          map-options
          hide-dropdown-icon
          hide-selected
          class="dr-theme q-mr-sm"
        >
          <template #prepend>
            <q-icon :name="darkIcon" size="22px" />
          </template>
          <q-tooltip>Theme</q-tooltip>
        </q-select>

        <q-btn-dropdown flat dense class="dr-user" :menu-offset="[0, 8]">
          <template #label>
            <UserAvatar :email="email" :size="36" />
            <span v-if="$q.screen.gt.xs" class="q-ml-sm dr-user__name">{{ fullName }}</span>
          </template>
          <div class="q-pa-sm">
            <q-list dense>
              <q-item to="/trackers">
                <q-item-section avatar>
                  <q-icon name="local_offer" />
                </q-item-section>
                <q-item-section>Tags</q-item-section>
              </q-item>

              <q-separator class="q-my-xs" />

              <q-item :to="`/profile`">
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>Profile</q-item-section>
              </q-item>

              <q-item to="/tokens">
                <q-item-section avatar>
                  <q-icon name="security" />
                </q-item-section>
                <q-item-section>Sessions</q-item-section>
              </q-item>

              <q-separator class="q-my-xs" />

              <q-item clickable @click="logout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="dr-page">
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import UserAvatar from 'components/UserAvatar.vue';
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from 'src/stores/auth';
import { useSettingsStore } from 'src/stores/settings';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const appName = ref(process.env.APP_NAME);
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const { fullName, email } = storeToRefs(authStore);
const { theme } = storeToRefs(settingsStore);

const themeOptions = [
  { value: 'auto', label: 'Auto (System)' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const darkIcon = computed(() => {
  if (theme.value === 'light') return 'light_mode';
  if (theme.value === 'dark') return 'dark_mode';
  return 'brightness_auto';
});

// Mirrors admin.app.pmi: 'auto' follows the system; otherwise dark unless the
// value is a *light variant. The body[theme] attr is reserved for named themes.
function applyTheme(value: string) {
  if (value === 'auto') {
    $q.dark.set('auto');
    document.body.removeAttribute('theme');
    return;
  }
  $q.dark.set(!value.includes('light'));
  const named = value.replace('light', '');
  if (named && named !== 'dark') {
    document.body.setAttribute('theme', named);
  } else {
    document.body.removeAttribute('theme');
  }
}

watch(
  theme,
  (value) => {
    settingsStore.setTheme(value);
    applyTheme(value);
  },
  { immediate: true },
);

function logout() {
  $q.dialog({
    title: 'Sure?',
    message: 'Logout of current session',
    ok: 'Confirm',
    cancel: 'Cancel',
    persistent: true,
  }).onOk(() => {
    authStore
      .logout()
      .then(() => {
        router.push('/').catch((err) => {
          console.error(err);
        });
      })
      .catch((err) => {
        console.error(err);
      });
  });
}
</script>

<style scoped lang="scss">
.dr-header {
  background: var(--dr-surface);
  color: var(--dr-text);
  // Quasar's dark theme sets a bright border-color on .q-header (more specific
  // than this rule), which showed as a white line — force our subtle divider.
  border-bottom: 1px solid var(--dr-border) !important;
  box-shadow: none;
}

.dr-toolbar {
  min-height: 64px;
  padding-inline: 18px;
}

.dr-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;

  &__name {
    font-weight: 800;
    font-size: 19px;
    letter-spacing: -0.02em;
    color: var(--dr-text);
  }
}

.dr-theme {
  // Shrink-wrap the field around the toggle icon. With `hide-selected` the
  // select otherwise reserved empty value space, leaving a large gap between
  // the icon and the avatar.
  width: auto;

  :deep(.q-field__control) {
    cursor: pointer;
    padding: 0;
  }

  :deep(.q-field__prepend) {
    color: var(--dr-muted);
    padding: 0;
  }

  :deep(.q-field__control-container) {
    width: 0;
    min-width: 0;
    padding: 0;
  }
}

.dr-user {
  border-radius: var(--dr-r-pill);

  &__name {
    font-weight: 600;
    font-size: 15px;
    color: var(--dr-text);
  }
}

.dr-page {
  min-height: calc(100vh - 64px);
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 599px) {
    padding: 16px;
  }
}
</style>
