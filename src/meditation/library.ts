// The meditations: the built-in guided ones of v1, the ones the user adds, favourites, what was watched, and the note.
import builtIn from '../data/meditations.json';

export type Meditation = {
  // the YouTube id, which is also the id in the library
  id: string;
  name: string;
  description: string;
  // hh:mm or hh:mm:ss
  duration: string;
  // the text of the Nomie note; it carries the #meditation tracker and the teacher
  note: string;
  youtubeId: string;
  userDefined: boolean;
};

export type Watched = { id: string; at: string; seconds: number };

export const BUILT_IN: Meditation[] = (builtIn as Array<Omit<Meditation, 'id' | 'userDefined'>>).map((m) => ({
  ...m,
  id: m.youtubeId,
  userDefined: false,
}));

const DURATION = /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

// The seconds of a duration such as 00:10:00, or undefined when it is not a duration
export const parseDuration = (text: string): number | undefined => {
  const match = DURATION.exec(text.trim());
  if (!match) return undefined;
  const [h, m, s] = [match[1], match[2], match[3]?.slice(1) ?? '0'].map(Number);
  return h * 3600 + m * 60 + s;
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
};

// The first thing wrong with a meditation the user adds, or null when it can be saved
export const meditationProblem = (m: Pick<Meditation, 'name' | 'duration' | 'youtubeId' | 'note'>): string | null => {
  if (!m.name.trim()) return 'Give the meditation a name.';
  if (parseDuration(m.duration) === undefined) return 'The duration is hh:mm or hh:mm:ss, for example 00:10:00.';
  if (!YOUTUBE_ID.test(m.youtubeId.trim())) return 'The YouTube id is the 11 characters after v= in the link.';
  if (!m.note.trim()) return 'The note needs a line, for example #meditation(00:10:00).';
  return null;
};

// The YouTube id from a pasted link, or the id itself
export const youtubeIdFrom = (text: string): string => {
  const trimmed = text.trim();
  const fromLink = /(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/.exec(trimmed);
  return fromLink ? fromLink[1] : trimmed;
};

// Reads the saved meditations the user added. Ones that are not well formed are left out.
export const normaliseCustom = (saved: unknown): Meditation[] => {
  if (!Array.isArray(saved)) return [];
  return saved.flatMap((m: any): Meditation[] => {
    const item = { name: String(m?.name ?? ''), duration: String(m?.duration ?? ''), youtubeId: String(m?.youtubeId ?? ''), note: String(m?.note ?? '') };
    if (meditationProblem(item)) return [];
    return [{ id: item.youtubeId, ...item, name: item.name.trim(), description: String(m.description ?? ''), youtubeId: item.youtubeId.trim(), userDefined: true }];
  });
};

// The user's meditations first, then the built-in ones, as v1 listed them
export const allMeditations = (custom: Meditation[]): Meditation[] => {
  const ids = new Set(custom.map((m) => m.id));
  return [...custom, ...BUILT_IN.filter((m) => !ids.has(m.id))];
};

export const toggleFavourite = (favourites: string[], id: string): string[] =>
  favourites.includes(id) ? favourites.filter((f) => f !== id) : [...favourites, id];

const DAY = 24 * 60 * 60 * 1000;

// The meditations finished in the week of `now` (Monday to now), and the minutes they took
export const thisWeek = (watched: Watched[], now: Date): { count: number; minutes: number } => {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).getTime();
  const inWeek = watched.filter((w) => Date.parse(w.at) >= monday);
  return { count: inWeek.length, minutes: Math.round(inWeek.reduce((sum, w) => sum + w.seconds, 0) / 60) };
};

// A meditation for today: a favourite not watched in the last week first, then any not watched, then any
export const suggestionFor = (list: Meditation[], favourites: string[], watched: Watched[], now: Date, random = Math.random): Meditation | undefined => {
  const recent = new Set(watched.filter((w) => now.getTime() - Date.parse(w.at) < 7 * DAY).map((w) => w.id));
  const unseen = list.filter((m) => !recent.has(m.id));
  const pool = unseen.filter((m) => favourites.includes(m.id));
  const choices = pool.length ? pool : unseen.length ? unseen : list;
  return choices.length ? choices[Math.floor(random() * choices.length)] : undefined;
};

// The text of the note when a meditation is finished, as v1 wrote it
export const noteFor = (m: Meditation): { note: string; score: number } => ({
  note: `${m.note} +yt_${m.youtubeId} +care`,
  score: 3,
});
