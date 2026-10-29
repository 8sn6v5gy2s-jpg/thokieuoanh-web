# Thơ Kiều Oanh

Static site cho thơ của Kiều Oanh. Astro + Pagefind + Cloudflare Pages.

## Chạy trên máy

```bash
npm install
npm run dev          # http://localhost:4321 — tìm kiếm KHÔNG chạy ở đây
```

Tìm kiếm chỉ hoạt động trên bản build:

```bash
npm run build        # build + tạo index Pagefind
npm run preview      # http://localhost:4321 — đầy đủ, kể cả search
```

> Node >= 22. Trên máy này, node 26 nằm ở `~/.hermes/tools/node-26.12.1-linux-arm64/bin`, cần export PATH trước.

## Thêm một bài thơ

```bash
npm run new -- "Tựa bài" 1998 "Mẹ, Quê nhà"
```

Không truyền tham số thì script hỏi từng thứ. File mới nằm ở `src/content/tho/`.
Ngày nhận `YYYY-MM-DD` hoặc chỉ `1998` (thành 1998-01-01).

Hoặc tạo tay một file `.md`:

```markdown
---
title: "Tựa bài"
date: 1998-04-12
tags: ["Mẹ", "Quê nhà"]
featured: false
draft: false
---

Dòng thơ thứ nhất
dòng thơ thứ hai

Khổ thứ hai
giữ nguyên xuống dòng
```

- `featured: true` — bài này lên khối lớn ở trang chủ (chỉ nên có một bài).
- `draft: true` — ẩn khỏi site hoàn toàn.
- Xuống dòng trong phần nội dung được giữ nguyên (CSS `white-space: pre-line`).

## Nhập hàng loạt từ file có sẵn

1. Bỏ file `.txt` hoặc `.md` vào thư mục `inbox/`.
2. `npm run import`
3. Mở từng file trong `src/content/tho/` để sửa ngày và tag.

Quy ước file nguồn: dòng đầu không trống là tựa đề, phần còn lại là thơ.
Nhiều bài trong một file thì ngăn bằng một dòng chỉ có `---` hoặc `***`.
Năm trong tên file (`hoa-xoan-2011.txt`) được dùng làm ngày mặc định.

Script không ghi đè file đã tồn tại — trùng slug thì thêm hậu tố `-2`, `-3`.
Sau khi xong, **xoá file trong `inbox/`** để lần chạy sau không nhập lại.

## Cấu trúc

```
src/
  content/tho/          một file .md mỗi bài
  pages/
    index.astro         trang chủ
    tho/index.astro     kho thơ + filter
    tho/[slug].astro    một bài
    chu-de/index.astro  danh sách chủ đề
    chu-de/[tag].astro  một chủ đề
    gioi-thieu.astro    giới thiệu
    rss.xml.ts          RSS
    404.astro
  components/
    Ink.astro           illustration handdrawn (SVG inline)
    PoemCard.astro
  layouts/Base.astro    khung + search overlay
  lib/poems.js          query, format ngày, slug tiếng Việt
  styles/global.css     toàn bộ design tokens + styles
public/fonts/           Literata + Be Vietnam Pro, subset tiếng Việt
scripts/                import-poems.mjs, new-poem.mjs
inbox/                  nơi bỏ file nguồn để import
```

## Thiết kế

- Nền giấy `#FDFBF6`, mực `#2B2620`, phụ `#5C7355` (moss), nhấn `#B07B5C` (clay).
- Literata cho thân bài, Be Vietnam Pro cho nhãn/UI. Cả hai self-hosted, subset tiếng Việt.
- Illustration là SVG inline trong `Ink.astro` — `sprig`, `branch`, `bird`, `flower`, `wave`.
  Nét vẽ tay run nhẹ, dùng `currentColor` nên tự ăn màu accent.
- Có print stylesheet: Ctrl+P trên trang một bài ra bản in sạch.

## Deploy lên Cloudflare Pages

1. Push repo lên GitHub (private cũng được).
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Build command: `npm run build` — Output directory: `dist`
4. Environment: `NODE_VERSION=22`
5. Sau khi deploy xong, vào Porkbun trỏ nameserver về Cloudflare (hoặc thêm CNAME
   `www` → `<project>.pages.dev` và redirect domain gốc).

Sửa `site` trong `astro.config.mjs` thành domain thật trước khi deploy — nó dùng cho
canonical, sitemap và RSS.

## Còn thiếu / làm tiếp

- [ ] Thay 10 bài mẫu bằng thơ thật (import từ `inbox/`)
- [ ] Điền nội dung `/gioi-thieu` — đang là placeholder
- [ ] Ảnh OG mặc định (1200×630) cho chia sẻ Facebook/Zalo
- [ ] Domain thật trong `astro.config.mjs`
