#!/usr/bin/env node
/**
 * list-poems.mjs — xuất danh mục toàn bộ bài thơ ra file ngoài repo.
 *
 *   npm run index
 *
 * Sinh ra hai file ở thư mục dự án (ngang hàng với `site/`):
 *   - danh-muc-bai-tho.md    để đọc, dán vào chat, gửi ai cũng được
 *   - danh-muc-bai-tho.csv   để mở bằng Excel / Numbers nếu cần lọc
 *
 * Chỉ đọc, không sửa gì trong src/content/tho.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src', 'content', 'tho');
const OUT_DIR = path.resolve(ROOT, '..');

// ---- đọc frontmatter bằng tay, không cần thư viện ----
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (val === 'true' || val === 'false') {
      data[key] = val === 'true';
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      data[key] = val;
    } else {
      data[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return { data, body: m[2] };
}

const files = fs
  .readdirSync(SRC)
  .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
  .sort();

const rows = [];

for (const f of files) {
  const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
  const { data, body } = parseFrontmatter(raw);

  const lines = body
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  rows.push({
    file: f,
    title: data.title ?? '',
    date: data.date ?? '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    featured: data.featured === true,
    draft: data.draft === true,
    hasExcerpt: Boolean(data.excerpt && String(data.excerpt).trim()),
    lines: lines.length,
    chars: body.replace(/\s+/g, '').length,
  });
}

// mới nhất lên trước
rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.file.localeCompare(b.file)));

const today = new Date();
const stamp = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Ho_Chi_Minh',
  dateStyle: 'short',
  timeStyle: 'short',
}).format(today);

// ---- bảng tag ----
const tagCount = new Map();
for (const r of rows) {
  for (const t of r.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
}
const tagsSorted = [...tagCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'));

const noExcerpt = rows.filter((r) => !r.hasExcerpt);
const drafts = rows.filter((r) => r.draft);

// ---- markdown ----
const md = [];
md.push(`# Danh mục bài thơ — Kiều Oanh`);
md.push('');
md.push(`Cập nhật: ${stamp}  ·  ${rows.length} bài`);
md.push('');
md.push('File này tự sinh. Đừng sửa tay — sinh lại bằng `npm run index`.');
md.push('');
md.push('## Cách thêm bài mới');
md.push('');
md.push('Bạn không cần dán tay vào đây. Hai cách:');
md.push('');
md.push('```');
md.push('cd /Volumes/SSD/Artifacts/02-Projects/thokieuoanh.com/site');
md.push('npm run new -- "Tựa bài" 2026-10-30 "Tag"');
md.push('```');
md.push('');
md.push('hoặc đưa tôi nội dung bài thơ, tôi tạo file đúng chuẩn hộ.');
md.push('');
md.push('Sau khi thêm, chạy lại `npm run index` để bảng này cập nhật.');
md.push('');
md.push('## Bảng bài');
md.push('');
md.push('| # | Tên file | Tựa | Ngày | Chủ đề | Dòng | Featured |');
md.push('|---|---|---|---|---|---|---|');
rows.forEach((r, i) => {
  const tags = r.tags.join(', ') || '—';
  md.push(
    `| ${i + 1} | \`${r.file}\` | ${r.title.replace(/\|/g, '\\|')} | ${r.date || '—'} | ${tags} | ${r.lines} | ${r.featured ? 'có' : ''} |`
  );
});
md.push('');

md.push('## Chủ đề');
md.push('');
md.push('| Chủ đề | Số bài |');
md.push('|---|---|');
for (const [t, c] of tagsSorted) md.push(`| ${t} | ${c} |`);
md.push('');

md.push('## Kiểm tra');
md.push('');
md.push(`- Tổng số bài: **${rows.length}**`);
md.push(`- Bài chưa có \`excerpt\`: **${noExcerpt.length}** — không sao, web tự lấy hai dòng đầu.`);
md.push(`- Bài đang \`draft: true\` (không lên web): **${drafts.length}**${drafts.length ? ' — ' + drafts.map((r) => `\`${r.file}\``).join(', ') : ''}`);
md.push(`- Bài đánh dấu \`featured\`: **${rows.filter((r) => r.featured).length}**`);
md.push('');

// ---- csv ----
const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
const csv = [
  ['file', 'title', 'date', 'tags', 'lines', 'chars', 'featured', 'draft'].join(','),
  ...rows.map((r) =>
    [esc(r.file), esc(r.title), esc(r.date), esc(r.tags.join('; ')), r.lines, r.chars, r.featured, r.draft].join(',')
  ),
].join('\n');

const mdPath = path.join(OUT_DIR, 'danh-muc-bai-tho.md');
const csvPath = path.join(OUT_DIR, 'danh-muc-bai-tho.csv');

fs.writeFileSync(mdPath, md.join('\n') + '\n', 'utf8');
fs.writeFileSync(csvPath, csv + '\n', 'utf8');

console.log(`Đã ghi ${rows.length} bài:`);
console.log(`  ${mdPath}`);
console.log(`  ${csvPath}`);
