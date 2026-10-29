// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Khi xem qua Tailscale, site nằm dưới /tho.
// Đặt PUBLIC_BASE=/tho khi build để mọi link và asset đều có tiền tố.
// Bản deploy Cloudflare thật để trống (gốc domain).
const base = process.env.PUBLIC_BASE || '/';

export default defineConfig({
  site: 'https://thokieuoanh.com',
  base,
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
});
