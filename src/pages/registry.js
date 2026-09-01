import Lesson1 from './Lesson1.jsx';
import Lesson2 from './Lesson2.jsx';
import Lesson3 from './Lesson3.jsx';
import Lesson4 from './Lesson4.jsx';
import Lesson5 from './Lesson5.jsx';
import Lesson6 from './Lesson6.jsx';
import Lesson7 from './Lesson7.jsx';
import AppsLesson1 from './AppsLesson1.jsx';
import AppsLesson2 from './AppsLesson2.jsx';
import AppsLesson3 from './AppsLesson3.jsx';
import Backtest1 from './Backtest1.jsx';

// Maps a lesson id to the component that renders its content — 'l1'..'l7'
// from src/data/lessons.js (Technical track), 'a1'..'a3' from
// src/data/appsLessons.js (App & Website track), 'bt1'.. from
// src/data/backtestLessons.js (Backtest track). The id namespaces never
// collide, so all three tracks share one registry and one doneMap in
// App.jsx. Add one line here for every new LessonN.jsx / AppsLessonN.jsx /
// BacktestN.jsx you create.
export const lessonPages = {
  l1: Lesson1,
  l2: Lesson2,
  l3: Lesson3,
  l4: Lesson4,
  l5: Lesson5,
  l6: Lesson6,
  l7: Lesson7,
  a1: AppsLesson1,
  a2: AppsLesson2,
  a3: AppsLesson3,
  bt1: Backtest1,
};
