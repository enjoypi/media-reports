export interface SubtitleMeta {
  lang: string;
  format: string;
  url: string;
}

export interface Lesson {
  title: string;
  videoId: string;
  subtitles: SubtitleMeta[];
  index: number;
}

export interface Week {
  number: number;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  slug: string;
  name: string;
  url: string;
  weeks: Week[];
}
