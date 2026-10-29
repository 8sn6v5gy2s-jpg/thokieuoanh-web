import { getCollection } from 'astro:content';

/**
 * @typedef {Awaited<ReturnType<typeof getCollection<'tho'>>>[number]} Poem
 */

const VN_MONTHS = [
  'một', 'hai', 'ba', 'tư', 'năm', 'sáu',
  'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai',
];

export const slugOf = (poem) => poem.id.replace(/\.(md|mdx)$/, '');

export async function getPoems() {
  const poems = await getCollection('tho', ({ data }) => !data.draft);
  return poems.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function formatDate(date) {
  const d = date.getDate();
  const m = VN_MONTHS[date.getMonth()];
  return `${d} tháng ${m}, ${date.getFullYear()}`;
}

export function yearOf(date) {
  return String(date.getFullYear());
}

export function tagSlug(tag) {
  return tag
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function collectTags(poems) {
  const map = new Map();
  for (const p of poems) {
    for (const t of p.data.tags) {
      const slug = tagSlug(t);
      const existing = map.get(slug);
      if (existing) existing.count += 1;
      else map.set(slug, { name: t, slug, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
}

/** First ~2 lines of the poem body, used as a quiet excerpt. */
export function autoExcerpt(body, lines = 2) {
  const cleaned = (body ?? '').replace(/\r/g, '').split('\n').map((l) => l.trim());
  const kept = [];
  for (const line of cleaned) {
    if (!line) {
      if (kept.length) break;
      continue;
    }
    kept.push(line);
    if (kept.length >= lines) break;
  }
  return kept.join('\n');
}

export function excerptOf(poem) {
  return poem.data.excerpt?.trim() || autoExcerpt(poem.body);
}

/**
 * Meta description cho SEO — KHÁC với excerpt hiển thị trên trang.
 * Ưu tiên frontmatter `excerpt`, nếu không có thì ghép một câu mô tả
 * mang thông tin (tác giả, chủ đề, nguồn) chứ không chỉ trích thơ —
 * câu thơ trần không nói được bài viết về gì.
 * Cắt ở ~155 ký tự để Google không cắt giữa từ.
 */
export function metaDescriptionOf(poem, siteName = 'Kiều Oanh') {
  const manual = poem.data.excerpt?.trim();
  if (manual) return clamp(manual, 155);

  const tags = poem.data.tags ?? [];
  const topic = tags.length
    ? `về ${tags.slice(0, 2).join(' và ').toLowerCase()}`
    : '';
  // Lấy 2 dòng đầu rồi nối bằng dấu phẩy — một dòng ngắn như "Thênh Thang"
  // trích riêng ra thì vô nghĩa.
  const opening = autoExcerpt(poem.body, 2)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join(', ');

  const parts = [
    `Bài thơ "${poem.data.title}" của ${siteName}${topic ? `, ${topic}` : ''}.`,
    opening ? `Mở đầu: ${opening}.` : '',
    'Đọc trọn bài trên trang thơ Kiều Oanh.',
  ].filter(Boolean);

  return clamp(parts.join(' '), 155);
}

function clamp(text, max) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : max).trimEnd()}…`;
}
