import * as SecureStore from 'expo-secure-store';

const KEY = 'vetagent_jwt';

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(KEY, token, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
}
export async function loadToken() {
  return await SecureStore.getItemAsync(KEY);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(KEY);
}