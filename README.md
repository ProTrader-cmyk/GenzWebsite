# GenZ Trader — Mentorship Site

React/Vite conversion of the original single-page HTML mentorship course.

## Run it

```bash
npm install
npm run dev      # dev server
npm run build    # production build to dist/
```

## Lessons

`src/data/lessons.js` is the ordered list of lessons and drives everything:
the home page's lesson cards, the progress bar, each lesson's auto-numbered
"មេរៀនទី N · Lesson 0N" header, and the prev/next links at the bottom of
every lesson page. `src/pages/Lesson2.jsx`–`Lesson5.jsx` currently exist as
placeholders (a single "content coming soon" box) — replace the body of
each with real content whenever it's ready; nothing else needs to change.

### Adding a lesson beyond the 5 scaffolded ones

1. **Add an entry to `src/data/lessons.js`**

   ```js
   {
     id: 'l6',
     title: 'Liquidity',                 // shown on the home lesson card
     subtitle: 'BSL · SSL · Sweeps · ...',
     pageTitle: 'Liquidity — សន្ទនីយភាព', // shown as the <h2> on the lesson page
   },
   ```

   Its position in the array determines its order on the home page and its
   numbering — nothing else to update by hand.

2. **Create `src/pages/Lesson6.jsx`**, using `LessonLayout` for the page
   chrome and the reusable content blocks from `src/components/ui/` (`Box`,
   `GridItem`, `Rule`, `AnimatedFig`, `Quiz`, `AnswerReveal`). `LessonLayout`
   already renders the back link and the bottom prev/next nav automatically
   (the "prev" link and its label come from whichever lesson precedes this
   one in `lessons.js`) — the file only needs the lesson's actual content:

   ```jsx
   import LessonLayout from '../components/LessonLayout.jsx';
   import Box from '../components/ui/Box.jsx';
   import { getLessonMeta } from '../data/lessons.js';

   const meta = getLessonMeta('l6');

   export default function Lesson6({ onNavigate, onDone }) {
     return (
       <LessonLayout id="l6" title={meta.pageTitle} onNavigate={onNavigate} onDone={onDone}>
         <p>Lesson content goes here…</p>
         <Box variant="g"><p>...</p></Box>
       </LessonLayout>
     );
   }
   ```

3. **Register it in `src/pages/registry.js`**

   ```js
   import Lesson6 from './Lesson6.jsx';

   export const lessonPages = {
     ...
     l6: Lesson6,
   };
   ```

That's it — `onDone` already advances to whatever lesson comes next in
`lessons.js` (or back home after the last one), and the home page's lesson
list / progress bar update automatically since they just map over that array.

### Reusable content components (`src/components/ui/`)

- `Box` — colored callout (`variant="g|u|d|b"` for gold/up/down/blue)
- `GridItem` — one card inside a `.g2`/`.g3` grid
- `Rule` — the "ច្បាប់ចងចាំ" highlighted rule box
- `AnimatedFig` — wraps an SVG diagram with the fade-in animation + replay button
- `Quiz` — click-to-answer question (`options: [{label, type: 'ok'|'no'}]`)
- `AnswerReveal` — the "👁 មើលចម្លើយ" show/hide answer button

### Assets

Drop new images/videos into `src/assets/` and `import` them (Vite handles
hashing/bundling) — see the top of `Lesson1.jsx` for examples.

# GenzWebsite Re-deploy
git add -A
git commit -m "your message"
git pull --rebase origin main
git push origin main
