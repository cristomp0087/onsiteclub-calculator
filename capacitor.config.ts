import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ca.onsiteclub.calculator',
  appName: 'OnSite Calculator',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Plugins configuration here
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    },
  },
};

export default config;
