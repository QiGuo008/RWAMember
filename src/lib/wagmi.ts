import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { monadTestnet } from './chains';

export { monadTestnet };

export const config = getDefaultConfig({
  appName: 'RWA Member',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [monadTestnet],
  ssr: true,
});