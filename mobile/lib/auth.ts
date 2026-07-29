import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'cloudcode_token';

export interface CloudCodeUser {
  id: string;        // GitHub user ID
  login: string;     // GitHub username
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Store the JWT token securely on device with dual AsyncStorage backup for iPad / Expo Go compatibility.
 */
export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (e) {
    console.warn('[Auth] SecureStore setItem failed, falling back to AsyncStorage', e);
  }
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.warn('[Auth] AsyncStorage setItem failed', e);
  }
}

/**
 * Get the stored JWT token. Tries SecureStore first, falls back to AsyncStorage.
 */
export async function getToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) return token;
  } catch (e) {
    console.warn('[Auth] SecureStore getItem failed, trying AsyncStorage', e);
  }

  try {
    const fallbackToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (fallbackToken) return fallbackToken;
  } catch (e) {
    console.warn('[Auth] AsyncStorage getItem failed', e);
  }

  return null;
}

/**
 * Delete the JWT token (sign out) from both stores.
 */
export async function deleteToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (e) {}
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}

/**
 * Decode the JWT payload (without verifying — verification is done on the server).
 * Returns null if the token is malformed or expired.
 */
export function decodeToken(token: string): CloudCodeUser | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    // Check expiry
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    return decoded as CloudCodeUser;
  } catch {
    return null;
  }
}
