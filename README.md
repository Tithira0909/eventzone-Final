# Eventz One — Sanda Ek Dinak

Single-event landing page built with [Vite](https://vitejs.dev), [React](https://react.dev), [Tailwind CSS](https://tailwindcss.com), [framer-motion](https://www.framer.com/motion/) and [lucide-react](https://lucide.dev/).

## Poster
Place the poster image at `public/poster.jpg`.

## Theming
- Gold accent uses `amber-300`. Adjust by swapping with `amber-200` or `amber-400` in components.
- Primary teal shades come from Tailwind's default `teal` palette; change classes like `teal-600` to another shade as needed.

## Environment
Create a `.env` file in the project root and add `VITE_CHECKOUT_URL=<your checkout link>` to enable the **Pay Online** button on the VIP ticket.

## Development
```bash
npm install
npm run dev
```

## Build & Preview
```bash
npm run build
npm run preview
```
The generated static site is available in `dist/` and can be deployed to Netlify, Vercel, or any static host.
