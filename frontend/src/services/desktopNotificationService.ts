// Service for Native Desktop (OS-level) Web Notifications outside the browser

export type DesktopNotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface ShowDesktopNotificationOptions {
  title: string;
  message: string;
  icon?: string;
  tag?: string;
  actionUrl?: string;
  badge?: string;
  requireInteraction?: boolean;
}

/**
 * Checks if the Web Notification API is supported by the client browser.
 */
export function isDesktopNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets the current desktop notification permission status.
 */
export function getDesktopNotificationPermission(): DesktopNotificationPermissionStatus {
  if (!isDesktopNotificationSupported()) return 'unsupported';
  return Notification.permission as DesktopNotificationPermissionStatus;
}

/**
 * Requests permission from the user for desktop notifications.
 */
export async function requestDesktopNotificationPermission(): Promise<DesktopNotificationPermissionStatus> {
  if (!isDesktopNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission as DesktopNotificationPermissionStatus;
  } catch (err) {
    console.error('Error requesting desktop notification permission:', err);
    return Notification.permission as DesktopNotificationPermissionStatus;
  }
}

/**
 * Plays a pleasant, modern chime using Web Audio API (zero external assets needed).
 */
export function playNotificationChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // First tone (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.18, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.28);

    // Second tone (880 Hz - A5, harmonic bell)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (err) {
    // Ignore audio context autoplay blockage
  }
}

/**
 * Displays a system OS desktop notification outside the browser window.
 */
export function showDesktopNotification(options: ShowDesktopNotificationOptions): Notification | null {
  const {
    title,
    message,
    icon = '/vite.svg',
    badge = '/vite.svg',
    tag,
    actionUrl,
    requireInteraction = true
  } = options;

  // Always play chime for real-time awareness
  playNotificationChime();

  if (!isDesktopNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const options: any = {
      body: message,
      icon,
      badge,
      tag: tag || `portal-alert-${Date.now()}`,
      renotify: true,
      requireInteraction
    };
    const notification = new Notification(title, options);

    notification.onclick = (e) => {
      e.preventDefault();
      try {
        window.focus();
      } catch {}

      if (actionUrl) {
        if (actionUrl.startsWith('http://') || actionUrl.startsWith('https://')) {
          window.location.href = actionUrl;
        } else {
          window.location.href = `${window.location.origin}${actionUrl.startsWith('/') ? '' : '/'}${actionUrl}`;
        }
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('Failed to display native desktop notification:', err);
    return null;
  }
}
