<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar size="50px" style="background-color: #f0f8ff">
            <img src="../assets/icons/logo.png" />
          </q-avatar>
          <q-btn flat label="CrisprStitch" />
        </q-toolbar-title>
        <q-space />
        <q-tabs shrink stretch>
          <q-icon name="help" />
          <q-route-tab to="/guidance" label="Help" />
        </q-tabs>
        <div class="q-pa-md">
          <q-btn
            color="secondary"
            @click="$q.fullscreen.toggle()"
            :icon="$q.fullscreen.isActive ? 'fullscreen_exit' : 'fullscreen'"
          />
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
    </q-drawer>

    <q-page-container>
      <div style="margin: 50px">
        <router-view />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import EssentialLink, {
  EssentialLinkProps,
} from 'components/EssentialLink.vue';
import { useQuasar } from 'quasar';

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
// const resultCalculated = ref(true);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
const leftDrawerOpen = ref(false);
</script>
