// Chapter ids in climbing order. The dock, the scroll engine and the tower all count floors from here.
export const chapterIds = ['start', 'frontdesk', 'intake', 'assistant', 'backoffice', 'reports', 'apps', 'work', 'about', 'contact'] as const;
export type ChapterId = (typeof chapterIds)[number];
