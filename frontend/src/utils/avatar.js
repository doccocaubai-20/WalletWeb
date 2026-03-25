const AVATAR_URL_KEY = 'userAvatarUrl';
const AVATAR_VERSION_KEY = 'userAvatarVersion';

export const resolveAvatarSrc = (avatarUrl) => {
  const normalized = String(avatarUrl || '').trim();
  if (!normalized) return '';

  if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('data:')) {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    if (import.meta.env.DEV) {
      return `http://localhost:8080${normalized}`;
    }
    return normalized;
  }

  return normalized;
};

export const extractAvatarUrl = (profile) => {
  if (!profile || typeof profile !== 'object') {
    return '';
  }

  const nested = profile?.people?.avatarUrl;
  const root = profile?.avatarUrl;
  return String(nested || root || '').trim();
};

export const appendAvatarVersion = (url, version) => {
  if (!url) return '';
  const rawVersion = String(version || '').trim();
  if (!rawVersion) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(rawVersion)}`;
};

export const getStoredAvatar = () => {
  const avatarUrl = localStorage.getItem(AVATAR_URL_KEY) || '';
  const avatarVersion = localStorage.getItem(AVATAR_VERSION_KEY) || '';
  return { avatarUrl, avatarVersion };
};

export const storeAvatar = (avatarUrl) => {
  localStorage.setItem(AVATAR_URL_KEY, String(avatarUrl || ''));
  localStorage.setItem(AVATAR_VERSION_KEY, String(Date.now()));
  window.dispatchEvent(new Event('avatar:changed'));
};

export const clearStoredAvatar = () => {
  localStorage.removeItem(AVATAR_URL_KEY);
  localStorage.removeItem(AVATAR_VERSION_KEY);
  window.dispatchEvent(new Event('avatar:changed'));
};

export const getTopbarAvatarSrc = () => {
  const { avatarUrl, avatarVersion } = getStoredAvatar();
  const resolved = resolveAvatarSrc(avatarUrl);
  return appendAvatarVersion(resolved, avatarVersion);
};
