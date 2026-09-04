import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/* Card data lives in frontmatter; the case-study body is the markdown.
   One source of truth for both the Work grid and /work/[slug]. */
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    kind: z.enum(["Desktop App", "Internal tools", "Mobile App"]),
    status: z.string(),
    /* Drives the status square. null = no square. */
    dot: z.enum(["production", "active"]).nullable().default(null),
    /* Small softened line under the status, e.g. "LINUX RELEASE". */
    note: z.string().nullable().default(null),
    stack: z.string(),
    role: z.string(),
    year: z.string(),
    /* The foot cell is always LICENCE, so only the value varies. licence
       also drives the corner badge — open source projects get one, private
       ones say so. */
    licence: z.string(),
    licenceType: z.enum(["open", "private"]),
    blurb: z.string(),
    /* null = private repo. Drives the card's secondary affordance. */
    repo: z.url().nullable().default(null),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
