<template>
  <Modal v-if="showEnablePwaNotification" size="md" @close="showEnablePwaNotification = false">
    <div v-if="notificationPermissionDenied">Notification permission denied, please enable notifications in device settings.</div>
    <button v-else class="btn" @click="enableNotifications">Enable notifications</button>
    <Loading v-if="loading" class="w-8 h-8"></Loading>
  </Modal>
</template>

<script>
import Loading from './Loading.vue';
import Modal from './Modal.vue';

const PUBLIC_VAPID_KEY = 'BL_kVEenwYLPOpju9n33O_K8HotVGygaw2VoojqMe7z7wNYhULBe45twNaD0cWYLooCkW-AJCAt0JNeVVxxtSyo';

export default {
  name: 'PWA',
  components: {
    Loading,
    Modal,
  },
  data() {
    return {
      standalone: false,
      isIos: false,
      showEnablePwaNotification: false,
      notificationPermissionDenied: false,
      loading: false,
    }
  },
  created() {
    this.standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    this.isIos = /iphone/i.test(window.navigator.userAgent);
  },
  mounted() {
    this.registerServiceWorker();
    this.update();
    this.subscribeToNotificationPermissionChanges();
  },
  methods: {
    async registerServiceWorker() {
      if (!('serviceWorker' in navigator)) return;

      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    },

    async enableNotifications() {
      if (!('Notification' in window)) return;
      this.loading = true;
      const permission = await Notification.requestPermission();
      this.loading = false;
      if (permission === 'granted') {
        subscribeUserToPush();
        this.showEnablePwaNotification = false;
      }
    },

    async subscribeToNotificationPermissionChanges() {
      if ('permissions' in navigator) {
        const status = await navigator.permissions.query({ name: 'notifications' });
        
        status.onchange = () => {
          this.update();
        };
      }
    },

    update() {
      // iOS only supports web push once the app is installed to the home screen (standalone).
      // Desktop and other browsers support push notifications directly in a regular browser tab.
      const canReceivePush = this.isIos ? this.standalone : true;

      if (canReceivePush && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
        if (Notification.permission === 'granted') {
          this.showEnablePwaNotification = false;
          this.notificationPermissionDenied = false;
          subscribeUserToPush();
        } else if (Notification.permission === 'denied') {
          this.showEnablePwaNotification = true;
          this.notificationPermissionDenied = true;
        } else {
          this.showEnablePwaNotification = true;
          this.notificationPermissionDenied = false;
        }
      } else {
        this.showEnablePwaNotification = false;
        this.notificationPermissionDenied = false;
      }
    },
  }
}

// Helper to convert a Base64 URL-safe VAPID key to a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeUserToPush() {
  try {
    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // Required by Chrome & Safari
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      const res = await fetch('/api/save-push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
    }
  } catch (error) {
    console.error('Failed to subscribe user to push notifications:', error);
  }
}

</script>
