// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Địa chỉ công khai của site. Dùng cho sitemap, thẻ canonical, OG image.
// Đổi bằng biến môi trường PUBLIC_SITE khi cần (vd. sau này mua tên miền
// riêng thì build với PUBLIC_SITE=https://thokieuoanh.com).
const site = process.env.PUBLIC_SITE || 'https://thokieuoanh.pages.dev';

// Khi xem qua Tailscale, site nằm dưới /tho.
// Đặt PUBLIC_BASE=/tho khi build để mọi link và asset đều có tiền tố.
// Bản deploy Cloudflare thật để trống (gốc domain).
const base = process.env.PUBLIC_BASE || '/';

export default defineConfig({
  site,
  base,
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
});
