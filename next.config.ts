import type { NextConfig } from "next";

/**
 * Content-Security-Policy directives.
 *
 * - In development we use `Content-Security-Policy-Report-Only` so violations
 *   are logged but never blocked (avoids breaking hot-reload tooling).
 * - In production the header is enforced (`Content-Security-Policy`).
 *
 * `style-src 'unsafe-inline'` is required because Tailwind CSS emits inline
 * <style> blocks at build time and Next.js injects critical CSS inline.
 * All other directive sources are locked to `'self'`.
 */
const isDev = process.env.NODE_ENV === 'development';

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self'",
  // Tailwind / Next.js critical CSS requires unsafe-inline for style-src
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    // Report-only in development so hot-reload and React DevTools aren't blocked.
    // Enforced in production.
    key: isDev
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy',
    value: cspDirectives,
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to every route
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
