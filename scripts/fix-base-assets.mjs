#!/usr/bin/env node
/**
 * Build bản xem trước chạy dưới /tho (cho Tailscale).
 *
 * Vì sao cần script này:
 * Astro 7 có bug — khi `base` là '/tho', nó ghi tiền tố đó vào MỌI đường
 * dẫn trong HTML (kể cả src của script), nhưng vẫn xuất thư mục tài sản
 * ở gốc (`/_astro/`, `/fonts/`, ...). Kết quả: HTML gọi `/tho/_astro/x.js`,
 * file thật nằm ở `/_astro/x.js`, trình duyệt nhận 404 nên JS không chạy.
 * Triệu chứng bề ngoài: nút A−/A+ không đổi cỡ chữ, tìm kiếm im lặng.
 *
 * Cách xử lý: build xong thì chép các thư mục tài sản vào trong `tho/`
 * để khớp với đường dẫn HTML mong đợi. Idempotent — chạy lại vô hại.
 *
 * Dùng: npm run build:tho
 */
import { cp, mkdir, rm, access, copyFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = 'dist-tho';
const PREFIX = 'tho';

// Những thư mục/file HTML có thể tham chiếu tới.
const ASSETS = ['_astro', 'fonts', 'images', 'pagefind', 'favicon.svg'];

const exists = async (p) => access(p).then(() => true, () => false);

async function main() {
  const target = join(OUT, PREFIX);
  await mkdir(target, { recursive: true });

  for (const name of ASSETS) {
    const src = join(OUT, name);
    if (!(await exists(src))) continue;
    const dst = join(target, name);
    // xoá trước để tránh lồng thư mục khi chạy lại
    await rm(dst, { recursive: true, force: true });
    await cp(src, dst, { recursive: true });
    console.log(`  ✓ ${name} → ${dst}`);
  }
  // Bản xem trước phải KHÔNG cache — nếu không, Safari trên iPhone giữ
  // file JS cũ cả năm và mọi sửa đổi đều vô hình.
  await copyFile('scripts/headers-preview.txt', join(OUT, '_headers'));
  console.log('  ✓ _headers (no-store) cho bản xem trước');

  console.log(`\nTài sản đã đặt dưới /${PREFIX}/ — HTML sẽ tải được.`);
}

main().catch((err) => {
  console.error('Lỗi khi chép tài sản:', err);
  process.exit(1);
});
