const sessionTokenKey = 'buildflow-session';

function storageKey(key) {
  return key === 'buildflow-token' ? sessionTokenKey : key;
}

export async function getItemAsync(key) {
  return window.sessionStorage.getItem(storageKey(key));
}

export async function setItemAsync(key, value) {
  window.sessionStorage.setItem(storageKey(key), value);
}

export async function deleteItemAsync(key) {
  window.sessionStorage.removeItem(storageKey(key));
}
