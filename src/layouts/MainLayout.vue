<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar size="50px" style="background-color: #f0f8ff">
            <img src="../assets/icons/logo.png" />
          </q-avatar>
          <q-btn
            flat
            :label="$q.screen.gt.xs ? 'CrisprStitch' : void 0"
            to="/"
          />
        </q-toolbar-title>
        <q-space />
        <q-tabs shrink stretch>
          <q-icon name="help" />
          <q-route-tab to="/guidance" label="Help" />
        </q-tabs>
        <div class="q-pa-md">
          <q-btn color="red" @click="resetAll()" icon="restart_alt" to="/">
            <q-tooltip> Reset all data </q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Navigator </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
      <q-separator />
      <q-item
        clickable
        tag="a"
        href="https://zhangtaolab.org/software/crisprstitch"
        target="_blank"
        exact
      >
        <q-item-section avatar>
          <q-icon name="info" />
        </q-item-section>

        <q-item-section>
          <q-item-label>Download</q-item-label>
        </q-item-section>
      </q-item>
    </q-drawer>

    <q-page-container>
      <div style="margin: 50px">
        <router-view />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EssentialLink, {
  EssentialLinkProps,
} from 'components/EssentialLink.vue';
import { useQuasar } from 'quasar';
import { useSampleInfoStore } from 'src/stores/sampleinfo';
import { useWorkerStore } from 'src/stores/worker';
import { LocalStorage } from 'quasar';

const essentialLinks: EssentialLinkProps[] = [
  {
    title: 'Introduction',
    icon: 'description',
    link: '/',
  },
  {
    title: 'Input',
    caption: 'Input informations',
    icon: 'inbox',
    link: '/input',
  },
  {
    title: 'Result',
    caption: 'Graphs and Tables',
    icon: 'download',
    link: '/result',
  },
];
const $q = useQuasar();
const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function resetAll() {
  useWorkerStore().worker?.terminate();
  useWorkerStore().$reset();
  useSampleInfoStore().$reset();
  LocalStorage.clear();
  $q.notify({
    message: 'All data has been cleared',
    color: 'positive',
    position: 'top',
    timeout: 1000,
  });
}
</script>
