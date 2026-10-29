#!/usr/bin/env node
/**
 * new-poem.mjs — tạo một file thơ mới rồi mở nó trong editor.
 *
 *   npm run new -- "Tựa bài thơ" 1998 "Mẹ, Quê nhà"
 *
 * Không có tham số thì script sẽ hỏi từng thứ một.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { execFile } from 'node:child_process';
import { stdin as input, stdout as output } from 'node:process';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'src', 'content', 'tho');

const VI_MAP = {
  à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a', ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
  â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a', è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
  ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e', ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o', ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
  ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o', ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
  ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u', ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
  đ: 'd',
};

const slugify = (str) =>
  str
    .toLowerCase()
    .split('')
    .map((ch) => VI_MAP[ch] ?? ch)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70);

const today = new Date().toISOString().slice(0, 10);

let [title, dateArg, tagArg] = process.argv.slice(2);

if (!title) {
  const rl = readline.createInterface({ input, output });
  title = (await rl.question('Tựa bài: ')).trim();
  dateArg = (await rl.question(`Ngày (YYYY-MM-DD, mặc định ${today}): `)).trim();
  tagArg = (await rl.question('Chủ đề, cách nhau bằng dấu phẩy: ')).trim();
  rl.close();
}

// Accept YYYY-MM-DD or a bare year
let date = today;
if (dateArg && /^\d{4}-\d{2}-\d{2}$/.test(dateArg)) date = dateArg;
else if (dateArg && /^\d{4}$/.test(dateArg)) date = `${dateArg}-01-01`;

const tags = (tagArg ?? '')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean)
  .map((t) => `"${t}"`)
  .join(', ');

let slug = slugify(title);
if (!slug) slug = `bai-${Date.now()}`;

fs.mkdirSync(OUT, { recursive: true });

let finalSlug = slug;
let n = 2;
while (fs.existsSync(path.join(OUT, `${finalSlug}.md`))) {
  finalSlug = `${slug}-${n++}`;
}

const file = path.join(OUT, `${finalSlug}.md`);
const content = `---
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
tags: [${tags}]
featured: false
draft: false
---

Viết bài thơ ở đây. Mỗi dòng thơ là một dòng thật trong file này.
Dòng trống để ngắt khổ.

Giữ nguyên xuống dòng — trang web tôn trọng từng dòng.
`;

fs.writeFileSync(file, content, 'utf8');
console.log(`Đã tạo: ${path.relative(ROOT, file)}`);

const editor = process.env.EDITOR || process.env.VISUAL;
if (editor) {
  execFile(editor, [file], (err) => {
    if (err) console.error(`Không mở được ${editor}: ${err.message}`);
  });
} else {
  console.log('Mở file trên bằng editor bất kỳ để viết thơ.');
}
