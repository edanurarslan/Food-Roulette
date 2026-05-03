/**
 * Push + local notifications (Expo)
 * Used for cooking timer alerts and Expo push token registration.
 */

import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTIF_PREF_PUSH = 'notif_pref_push';
export const NOTIF_PREF_EMAIL = 'notif_pref_email';
export const NOTIF_PREF_RECIPE = 'notif_pref_recipe';
export const NOTIF_PREF_FAVORITE = 'notif_pref_favorite';

const COOKING_CHANNEL_ID = 'cooking-timer';

let notificationsModule: typeof import('expo-notifications') | null = null;
let deviceModule: typeof import('expo-device') | null = null;
let constantsModule: typeof import('expo-constants') | null = null;

async function loadModules(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    notificationsModule = await import('expo-notifications');
    deviceModule = await import('expo-device');
    constantsModule = await import('expo-constants');
    return true;
  } catch {
    return false;
  }
}

export async function configureNotificationHandler(): Promise<void> {
  const ok = await loadModules();
  if (!ok || !notificationsModule) return;
  notificationsModule.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureAndroidCookingChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const ok = await loadModules();
  if (!ok || !notificationsModule) return;
  await notificationsModule.setNotificationChannelAsync(COOKING_CHANNEL_ID, {
    name: 'Pişirme zamanlayıcısı',
    importance: notificationsModule.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'unavailable';
  const ok = await loadModules();
  if (!ok || !notificationsModule) return 'unavailable';
  const settings = await notificationsModule.getPermissionsAsync();
  if (settings.granted) return 'granted';
  if (settings.status === 'denied') return 'denied';
  return 'undetermined';
}

export async function requestNotificationPermissions(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'unavailable';
  const ok = await loadModules();
  if (!ok || !notificationsModule) return 'unavailable';
  await ensureAndroidCookingChannel();
  const existing = await notificationsModule.getPermissionsAsync();
  if (existing.granted) return 'granted';
  const asked = await notificationsModule.requestPermissionsAsync();
  if (asked.granted) return 'granted';
  if (asked.status === 'denied') return 'denied';
  return 'undetermined';
}

export async function getExpoPushTokenOrNull(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const ok = await loadModules();
  if (!ok || !notificationsModule || !deviceModule || !constantsModule) return null;
  if (!deviceModule.isDevice) {
    return null;
  }
  const perm = await requestNotificationPermissions();
  if (perm !== 'granted') return null;

  try {
    const projectId =
      constantsModule.default?.expoConfig?.extra?.eas?.projectId ??
      constantsModule.default?.easConfig?.projectId;
    const token = await notificationsModule.getExpoPushTokenAsync(
      projectId ? { projectId: String(projectId) } : undefined
    );
    return token.data ?? null;
  } catch (e) {
    console.warn('Expo push token alınamadı:', e);
    return null;
  }
}

const COOKING_TIMER_NOTIF_PREFIX = 'cooking-timer-';

export async function scheduleCookingTimerNotification(
  secondsFromNow: number,
  recipeName: string,
  recipeId: string
): Promise<string | null> {
  if (Platform.OS === 'web' || secondsFromNow <= 0) return null;
  const ok = await loadModules();
  if (!ok || !notificationsModule) return null;
  await ensureAndroidCookingChannel();
  const perm = await getNotificationPermissionStatus();
  if (perm !== 'granted') {
    return null;
  }
  const identifier = `${COOKING_TIMER_NOTIF_PREFIX}${recipeId}`;
  try {
    await notificationsModule.cancelScheduledNotificationAsync(identifier);
  } catch {
    // ignore
  }
  await notificationsModule.scheduleNotificationAsync({
    identifier,
    content: {
      title: 'Pişirme süresi doldu',
      body: `${recipeName} — zamanlayıcı bitti.`,
      sound: 'default',
      data: { recipeId, type: 'cooking_timer' },
      ...(Platform.OS === 'android' ? { channelId: COOKING_CHANNEL_ID } : {}),
    },
    trigger: {
      type: notificationsModule.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.floor(secondsFromNow)),
      repeats: false,
    },
  });
  return identifier;
}

export async function cancelCookingTimerNotification(recipeId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const ok = await loadModules();
  if (!ok || !notificationsModule) return;
  const identifier = `${COOKING_TIMER_NOTIF_PREFIX}${recipeId}`;
  try {
    await notificationsModule.cancelScheduledNotificationAsync(identifier);
  } catch {
    // ignore
  }
}

export async function readPushPreference(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(NOTIF_PREF_PUSH);
    if (v === null) return true;
    return v === 'true';
  } catch {
    return true;
  }
}

export function alertNotificationDenied(): void {
  Alert.alert(
    'Bildirim izni',
    'Zamanlayıcı uyarıları için Ayarlar’dan bildirimlere izin verebilirsiniz.',
    [{ text: 'Tamam' }]
  );
}
