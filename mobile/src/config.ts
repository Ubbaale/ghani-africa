import Constants from 'expo-constants';

export const APP_URL = Constants.expoConfig?.extra?.appUrl || 'https://ghani-africa.replit.app';

export const APP_CONFIG = {
  name: 'Ghani Africa',
  version: Constants.expoConfig?.version || '1.0.0',
  colors: {
    primary: '#1a6b3c',
    accent: '#c97f44',
    background: '#1a1a1a',
    surface: '#ffffff',
    text: '#333333',
    textLight: '#999999',
  },
};
