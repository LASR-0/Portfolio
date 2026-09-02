import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/* Card data lives in frontmatter; the case-study body is the markdown.
   One source of truth for both the Work grid and /work/[slug]. */
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    kind: z.enum(["Internal tools", "Open source", "Personal"]),
    status: z.string(),
    live: z.boolean().default(false),
    stack: z.string(),
    role: z.string(),
    year: z.string(),
    metricLabel: z.string(),
    metric: z.string(),
    blurb: z.string(),
    /* null = private repo. Drives the card's secondary affordance. */
    repo: z.url().nullable().default(null),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
