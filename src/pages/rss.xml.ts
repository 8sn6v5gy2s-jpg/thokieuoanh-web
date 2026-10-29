import type { APIRoute } from 'astro';
import { getPoems, slugOf, excerptOf } from '../lib/poems';

export const GET: APIRoute = async ({ site }) => {
  const poems = await getPoems();
  const base = site ?? new URL('https://kieuoanh.poetry');

  const items = poems.slice(0, 30).map((p) => {
    const link = new URL(`/tho/${slugOf(p)}/`, base).href;
    const desc = excerptOf(p).replace(/\n+/g, ' / ');
    return `    <item>
      <title><![CDATA[${p.data.title}]]></title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${p.data.date.toUTCString()}</pubDate>
      <description><![CDATA[${desc}]]></description>
    </item>`;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Thơ Kiều Oanh</title>
    <link>${base.href}</link>
    <description>Những bài thơ của Kiều Oanh.</description>
    <language>vi</language>
    <atom:link href="${new URL('/rss.xml', base).href}" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
