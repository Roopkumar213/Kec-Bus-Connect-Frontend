/**
 * KEC BusConnect Notification & Audio Alert Service
 * Handles browser push notifications, Service Worker integration,
 * and Web Audio API synthesized audible arrival chimes.
 */

class NotificationService {
  constructor() {
    this.swRegistration = null;
    this.audioCtx = null;
    this.initServiceWorker();
  }

  // Register service worker if supported
  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        this.swRegistration = reg;
      } catch (err) {
        console.warn('Service worker registration notice:', err.message);
      }
    }
  }

  // Request browser Notification permissions
  async requestPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch (e) {
      return 'denied';
    }
  }

  // Check if notifications are granted
  isPermissionGranted() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  // Play synthesized audio beep / chime using Web Audio API
  playArrivalChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // First beep: 880Hz (A5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Second harmonized chime: 1174.66Hz (D6)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.15);
      gain2.gain.setValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.65);
    } catch (err) {
      console.warn('Audio chime warning:', err.message);
    }
  }

  // Dispatch notification (Service Worker background notification if available, or native Notification)
  async showArrivalAlert(title, message, url = '/student/dashboard') {
    // 1. Play audible chime
    this.playArrivalChime();

    // 2. Dispatch system notification
    if (this.isPermissionGranted()) {
      if (this.swRegistration && this.swRegistration.showNotification) {
        try {
          await this.swRegistration.showNotification(title, {
            body: message,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            vibrate: [200, 100, 200, 100, 200],
            data: { url },
            requireInteraction: true,
          });
          return;
        } catch (e) {
          // fallback to native Notification
        }
      }

      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.svg'
        });
      } catch (err) {
        console.warn('Notification display warning:', err.message);
      }
    }
  }
}

export const notificationService = new NotificationService();
