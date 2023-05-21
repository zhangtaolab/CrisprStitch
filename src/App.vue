<template>
  <router-view />
</template>

<script setup lang="ts">
const userAgent = navigator.userAgent.toLowerCase();
if (userAgent.indexOf(' electron/') > -1) {
  // Electron-specific code
} else {
  window.onbeforeunload = (event) => {
    // Cancel the event to prevent the browser's default behavior
    event.preventDefault();
    // Customize the message for the pop-up alert
    const confirmationMessage =
      'Are you sure you want to leave this page? All data will be dropped.';

    // Display the pop-up alert
    event.returnValue = confirmationMessage;
    return confirmationMessage;
  };
}
</script>
