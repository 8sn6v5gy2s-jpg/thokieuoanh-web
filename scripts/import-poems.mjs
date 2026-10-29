#!/usr/bin/env node
/**
 * import-poems.mjs — chuyển một hoặc nhiều file .txt/.md/.docx đã có sẵn thành
 * các file thơ trong src/content/tho/.
 *
 * Cách dùng:
 *   1. Bỏ file nguồn vào thư mục `inbox/` ở gốc repo.
 *   2. npm run import
 *   3. Mở từng file vừa tạo trong src/content/tho/, sửa ngày/tag nếu cần.
 *
 * Quy ước trong file nguồn:
 *   - Dòng đầu tiên (không trống) = tựa đề bài thơ.
 *   - Một dòng trống theo sau tựa đề -> phần còn lại là thơ.
 *   - Nếu file có nhiều bài, ngăn cách bằng một dòng chỉ chứa `---` hoặc `***`.
 *   - Tên file nguồn được dùng để đoán năm nếu có dạng `ten-bai-1998.txt`.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const INBOX = path.join(ROOT, 'inbox');
const OUT = path.join(ROOT, 'src', 'content', 'tho');

const VI_MAP = {
  à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
  ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
  â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
  è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
  ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
  ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
  ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
  ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
  ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
  ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
  ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
  đ: 'd',
};

export function slugify(str) {
  return str
    .toLowerCase()
    .split('')
    .map((ch) => VI_MAP[ch] ?? ch)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70);
}

function yamlString(s) {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Split a source file into { title, body } blocks. */
function splitPoems(text, fallbackTitle) {
  const normalized = text.replace(/\r\n?/g, '\n').trim();
  if (!normalized) return [];

  // Explicit separators: a line with only --- or ***
  const chunks = normalized
    .split(/\n[ \t]*(?:-{3,}|\*{3,})[ \t]*\n/g)
    .map((c) => c.trim())
    .filter(Boolean);

  return chunks.map((chunk, i) => {
    const lines = chunk.split('\n');
    // First non-empty line is the title
    const title = lines[0].trim().replace(/^[#*>\s]+/, '').replace(/\s*[#*]+$/, '');
    const body = lines.slice(1).join('\n').replace(/^\n+/, '').trim();
    return {
      title: title || `${fallbackTitle} ${i + 1}`,
      body,
    };
  });
}

function guessYear(filename) {
  const m = filename.match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : new Date().getFullYear();
}

function writePoem({ title, body }, sourceName, index, total) {
  let slug = slugify(title);
  if (!slug) slug = `bai-${index + 1}`;

  // Avoid collisions
  let finalSlug = slug;
  let n = 2;
  while (fs.existsSync(path.join(OUT, `${finalSlug}.md`))) {
    finalSlug = `${slug}-${n++}`;
  }

  const year = guessYear(sourceName);
  const date = `${year}-01-01`;

  const frontmatter = [
    '---',
    `title: ${yamlString(title)}`,
    `date: ${date}`,
    'tags: []',
    'featured: false',
    'draft: false',
    '---',
    '',
  ].join('\n');

  const file = path.join(OUT, `${finalSlug}.md`);
  fs.writeFileSync(file, frontmatter + body + '\n', 'utf8');
  return file;
}

// ---------------------------------------------------------------- main
if (!fs.existsSync(INBOX)) {
  console.log(`Chưa có thư mục inbox/. Tạo nó rồi bỏ file thơ vào: ${INBOX}`);
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });

const files = fs
  .readdirSync(INBOX)
  .filter((f) => /\.(txt|md|markdown)$/i.test(f))
  .sort();

if (!files.length) {
  console.log('inbox/ trống. Bỏ file .txt hoặc .md vào rồi chạy lại.');
  process.exit(0);
}

let created = 0;
for (const file of files) {
  const full = path.join(INBOX, file);
  const text = fs.readFileSync(full, 'utf8');
  const base = path.basename(file, path.extname(file));
  const poems = splitPoems(text, base);

  poems.forEach((poem, i) => {
    if (!poem.body) {
      console.warn(`  bỏ qua (không có nội dung): ${file} — "${poem.title}"`);
      return;
    }
    const out = writePoem(poem, file, i, poems.length);
    console.log(`  + ${path.relative(ROOT, out)}   (${poem.title})`);
    created += 1;
  });
}

console.log(`\nXong: ${created} bài. Kiểm tra lại ngày và tag trong src/content/tho/.`);
if (created) {
  console.log('Nhớ xoá hoặc chuyển file nguồn ra khỏi inbox/ để tránh nhập lại.');
}
