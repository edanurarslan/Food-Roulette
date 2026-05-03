/**
 * Registers Expo push token with backend when user is logged in and push pref is on.
 */

import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import {
  configureNotificationHandler,
  getExpoPushTokenOrNull,
  readPushPreference,
} from '../services/notifications';

export const PushTokenBootstrap: React.FC = () => {
  const { token, user, isLoading } = useAuth();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (isLoading || !token || !user) {
      lastSent.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      const allow = await readPushPreference();
      if (!allow || cancelled) return;

      const expoToken = await getExpoPushTokenOrNull();
      if (!expoToken || cancelled) return;

      if (lastSent.current === expoToken) return;

      try {
        await apiService.registerPushToken(expoToken, Platform.OS);
        lastSent.current = expoToken;
      } catch (e) {
        console.warn('Push token backend kaydı başarısız:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, token, user?.id]);

  return null;
};
