<template>
  <q-layout>
    <q-header>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>{{ appName }}</q-toolbar-title>

        <q-space />

        <q-btn-dropdown flat dense class="q-ml-md">
          <template #label>
            <UserAvatar :email="email" :size="45" />
            <span v-if="$q.screen.gt.xs" class="q-ml-sm fs-16 custom-name">{{ fullName }}</span>
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

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page class="q-ma-md" :style="{ minHeight: 'calc(100vh - 80px)' }">
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

console.log(appName.value);

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
