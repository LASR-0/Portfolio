import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: provisional. The domain is not registered yet — confirm before launch.
  // Everything absolute depends on this: canonical links, the sitemap, and the
  // og:image / og:url tags. Without it Astro.url resolves to localhost and the
  // production build ships <link rel="canonical" href="http://localhost:4321/">.
  site: 'https://lukeroxburgh.dev',
  adapter: cloudflare(),
  integrations: [
    react(),
    // /og is the source for the social card, not a page anyone should land on.
    sitemap({ filter: (page) => !page.includes('/og') }),
  ],
});
