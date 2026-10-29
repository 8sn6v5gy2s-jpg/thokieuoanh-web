import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tho = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/tho' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    excerpt: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { tho };
