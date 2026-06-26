<template>
  <q-layout view="hHh Lpr lFf">
    <q-header class="dr-header">
      <q-toolbar class="dr-toolbar">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="dr-icon-btn"
          @click="toggleLeftDrawer"
        />

        <router-link to="/trackers" class="dr-brand">
          <img src="~assets/logo.svg" alt="Dracker" width="28" height="28" />
          <span class="dr-brand__name">{{ appName }}</span>
        </router-link>

        <q-space />

        <q-btn-dropdown flat dense class="dr-user q-ml-md" :menu-offset="[0, 8]">
          <template #label>
            <UserAvatar :email="email" :size="36" />
            <span v-if="$q.screen.gt.xs" class="q-ml-sm dr-user__name">{{ fullName }}</span>
          </template>
          <div class="q-pa-sm">
            <q-list dense>
              <q-item :to="`/profile`">
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>Profile</q-item-section>
              </q-item>

              <q-separator />

              <q-item to="/tokens">
                <q-item-section avatar>
                  <q-icon name="security" />
                </q-item-section>
                <q-item-section>Sessions</q-item-section>
              </q-item>

              <q-separator />

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

    <q-drawer v-model="leftDrawerOpen" show-if-above :width="248" class="dr-drawer">
      <div class="dr-drawer__label">Menu</div>
      <q-list padding>
        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page class="dr-page">
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';
import UserAvatar from 'components/UserAvatar.vue';
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from 'src/stores/auth';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const linksList: EssentialLinkProps[] = [
  {
    title: 'Trackers',
    caption: 'List of Trackers',
    icon: 'center_focus_weak',
    link: '/trackers',
  },
  {
    title: 'Pings',
    caption: 'List of Tracker pings',
    icon: 'radar',
    link: '/pings',
  },
];

const $q = useQuasar();
const appName = ref(process.env.APP_NAME);
const authStore = useAuthStore();
const router = useRouter();
const { fullName, email } = storeToRefs(authStore);
const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

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
  border-bottom: 1px solid var(--dr-border);
  box-shadow: none;
}

.dr-toolbar {
  min-height: 64px;
  padding-inline: 12px;
}

.dr-icon-btn {
  color: var(--dr-muted);
}

.dr-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 6px;
  text-decoration: none;

  &__name {
    font-weight: 800;
    font-size: 19px;
    letter-spacing: -0.02em;
    color: var(--dr-text);
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

.dr-drawer {
  background: var(--dr-surface);
  border-right: 1px solid var(--dr-border);

  &__label {
    padding: 18px 22px 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dr-faint);
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
