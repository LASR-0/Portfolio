/* TODO assets (plan.md §14): hairline-framed placeholders until the real
   images land. Heights vary so the columns layout can be judged. Once real
   files exist these become astro:assets images with width/height so the
   masonry does not reflow on load. */

export interface Art { title: string; medium: string; year: string; h: string; }

export const art: Art[] = [
  { title: "Untitled", medium: "Digital", year: "2026", h: "320px" },
  { title: "Untitled", medium: "Digital", year: "2026", h: "210px" },
  { title: "Untitled", medium: "Digital", year: "2025", h: "270px" },
  { title: "Untitled", medium: "Digital", year: "2025", h: "180px" },
  { title: "Untitled", medium: "Ink on paper", year: "2025", h: "340px" },
  { title: "Untitled", medium: "Digital", year: "2024", h: "230px" },
  { title: "Untitled", medium: "Digital", year: "2024", h: "290px" },
  { title: "Untitled", medium: "Digital", year: "2024", h: "200px" },
];
