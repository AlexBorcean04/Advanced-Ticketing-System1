const USER_TOKEN_KEY = 'user_token';
const USER_PROFILE_KEY = 'user_profile';

export const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY);

export const setUserToken = (token) => {
  localStorage.setItem(USER_TOKEN_KEY, token);
};

export const clearUserToken = () => {
  localStorage.removeItem(USER_TOKEN_KEY);
};

export const getUserProfile = () => {
  const raw = localStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

export const setUserProfile = (profile) => {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
};

export const clearUserProfile = () => {
  localStorage.removeItem(USER_PROFILE_KEY);
};

export const clearUserSession = () => {
  clearUserToken();
  clearUserProfile();
};

export const isUserAuthed = () => Boolean(getUserToken());
