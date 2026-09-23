import { lazy } from 'react';

// Maps a lesson id to the component that renders its content — 'l1'..'l7'
// from src/data/lessons.js (Technical track), 'a1'..'a3' from
// src/data/appsLessons.js (App & Website track), 'bt1'.. from
// src/data/backtestLessons.js (Backtest track), 'psy1'.. from
// src/data/psychologyLessons.js (Psychology track). The id namespaces never
// collide, so all tracks share one registry and one doneMap in App.jsx. Add
// one line here for every new LessonN.jsx / AppsLessonN.jsx / BacktestN.jsx
// / PsychologyN.jsx / AdvancedN.jsx you create.
//
// Lazy-loaded (each becomes its own chunk, fetched only when opened) since
// lesson content is the bulk of the app's source and most of it is never
// touched by a given visitor — App.jsx wraps <CurrentLesson> in <Suspense>.
export const lessonPages = {
  l1: lazy(() => import('./Lesson1.jsx')),
  l2: lazy(() => import('./Lesson2.jsx')),
  l3: lazy(() => import('./Lesson3.jsx')),
  l4: lazy(() => import('./Lesson4.jsx')),
  l5: lazy(() => import('./Lesson5.jsx')),
  l6: lazy(() => import('./Lesson6.jsx')),
  l7: lazy(() => import('./Lesson7.jsx')),
  a1: lazy(() => import('./AppsLesson1.jsx')),
  a2: lazy(() => import('./AppsLesson2.jsx')),
  a3: lazy(() => import('./AppsLesson3.jsx')),
  bt1: lazy(() => import('./Backtest1.jsx')),
  bt2: lazy(() => import('./Backtest2.jsx')),
  bt3: lazy(() => import('./Backtest3.jsx')),
  bt4: lazy(() => import('./Backtest4.jsx')),
  psy1: lazy(() => import('./Psychology1.jsx')),
  psy2: lazy(() => import('./Psychology2.jsx')),
  adv1: lazy(() => import('./Advanced1.jsx')),
  adv2: lazy(() => import('./Advanced2.jsx')),
  adv3: lazy(() => import('./Advanced3.jsx')),
  adv4: lazy(() => import('./Advanced4.jsx')),
  adv5: lazy(() => import('./Advanced5.jsx')),
};
