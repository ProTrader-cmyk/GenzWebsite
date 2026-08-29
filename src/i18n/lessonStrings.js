// Shared chrome strings for lesson pages (nav labels, quiz feedback
// defaults, final-test progress line). Per-lesson content (paragraphs,
// quiz questions, homework) lives in each Lesson*.jsx file's own content
// dictionary.
export const lessonChrome = {
  kh: {
    backToList: '← បញ្ជីមេរៀន',
    finishLesson: '✓ បញ្ចប់មេរៀន',
    start: '← ដើម',
    hideAnswer: '▲ លាក់ចម្លើយ',
    finalTestLockedHint: 'ត្រូវត្រូវទាំងអស់ដើម្បីដោះសោមេរៀនបន្ទាប់',
    finalTestUnlockedSuffix: '— ដោះសោរួចរាល់ហើយ ✓',
    finalTestAnsweredPrefix: 'ឆ្លើយត្រូវ',
    replay: '▶ ចាក់ម្ដងទៀត',
  },
  en: {
    backToList: '← Lesson list',
    finishLesson: '✓ Finish lesson',
    start: '← Start',
    hideAnswer: '▲ Hide answer',
    finalTestLockedHint: 'Answer all correctly to unlock the next lesson',
    finalTestUnlockedSuffix: '— unlocked ✓',
    finalTestAnsweredPrefix: 'Correct',
    replay: '▶ Replay',
  },
  zh: {
    backToList: '← 课程列表',
    finishLesson: '✓ 完成课程',
    start: '← 开始',
    hideAnswer: '▲ 隐藏答案',
    finalTestLockedHint: '全部答对才能解锁下一课',
    finalTestUnlockedSuffix: '— 已解锁 ✓',
    finalTestAnsweredPrefix: '答对',
    replay: '▶ 重播',
  },
};

export function getLessonChrome(lang) {
  return lessonChrome[lang] ?? lessonChrome.kh;
}
