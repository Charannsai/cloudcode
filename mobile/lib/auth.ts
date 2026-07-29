import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const TOKEN_KEY = 'cloudcode_token';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://165.22.219.62:3000';

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
 * Standard, robust Base64 decoder for React Native Hermes.
 */
function base64Decode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let cleaned = str.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  let output = '';

  for (let bc = 0, bs = 0, bufferIdx = 0, i = 0; i < cleaned.length; i++) {
    const char = cleaned.charAt(i);
    bufferIdx = chars.indexOf(char);
    if (bufferIdx === -1) continue;

    bs = bc % 4 ? bs * 64 + bufferIdx : bufferIdx;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
}

/**
 * Safely decodes base64url string to UTF-8 JSON.
 */
function decodeBase64Url(input: string): string {
  const raw = base64Decode(input);
  try {
    return decodeURIComponent(
      raw
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return raw;
  }
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
 * Decode the JWT payload safely without relying on window.atob or buggy one-liners.
 * Returns null if the token is malformed or expired.
 */
export function decodeToken(token: string): CloudCodeUser | null {
  try {
    if (!token || typeof token !== 'string') return null;
    let cleanToken = token.trim();
    if (cleanToken.startsWith('Bearer ')) {
      cleanToken = cleanToken.slice(7).trim();
    }
    cleanToken = cleanToken.replace(/^"+|"+$/g, '');

    const parts = cleanToken.split('.');
    if (parts.length < 2) return null;

    const payload = parts[1];
    const jsonStr = decodeBase64Url(payload);
    const decoded = JSON.parse(jsonStr);

    // Check expiry
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;

    return {
      id: String(decoded.id || decoded.sub || ''),
      login: String(decoded.login || decoded.username || decoded.name || 'user'),
      email: decoded.email || null,
      name: decoded.name || null,
      avatar_url: decoded.avatar_url || null,
    };
  } catch (e) {
    console.warn('[Auth] decodeToken error:', e);
    return null;
  }
}

/**
 * Triggers full GitHub OAuth flow using Expo WebBrowser & Linking.
 */
export async function promptGitHubSignIn(): Promise<string | null> {
  try {
    const redirectUri = Linking.createURL('/auth');
    const authUrl = `${API_URL}/cc-api/auth/github?redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
      const parsed = Linking.parse(result.url);
      const token = parsed.queryParams?.token as string | undefined;
      if (token) {
        return token;
      }
    }
  } catch (err) {
    console.error('[Auth] GitHub Auth Error:', err);
  }
  return null;
}
