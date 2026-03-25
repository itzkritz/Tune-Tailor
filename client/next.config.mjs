/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    // This removes the "N" black circle floating button shown on Next.js 14/15 during development
    appIsrStatus: false,
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
};

export default nextConfig;
