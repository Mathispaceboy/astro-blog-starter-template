# Bringleads website

The Bringleads marketing website, built with Astro and configured for Cloudflare Workers.

## Pages included

- Homepage
- Five service pages
- Five industry pages
- About, Results, Start Here, Resources and Contact

## Local preview

Use Node.js 22 or newer.

```sh
npm install
npm run dev
```

Then open `http://localhost:4321`.

## Cloudflare deployment

The included `wrangler.json` and Astro Cloudflare adapter retain the starter project's Worker deployment model.

The Worker name remains `astro-blog-starter-template` so pushing this code updates the Worker that is already live at `astro-blog-starter-template.mathispaceboy.workers.dev`. You can rename it later from Cloudflare after the new site is safely deployed.

When connected to GitHub, Cloudflare should use:

- Build command: `npm run build`
- Deploy command: `npm run deploy`
- Production branch: `main`

After the production build succeeds, add `bringleads.in` from the Worker's Custom Domains area.

## Before final launch

1. Replace or approve the draft service and company copy.
2. Add verified case studies only after client approval.
3. Connect the contact form to a private Cloudflare submission endpoint. The current form prepares an email in the visitor's email app.
4. Connect analytics and your preferred booking calendar.
5. Test `bringleads.in` and `www.bringleads.in`, then choose one canonical version.
