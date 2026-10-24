import { describe, expect, it } from 'vitest';
import { BUILT_IN, allMeditations, formatDuration, meditationProblem, noteFor, normaliseCustom, parseDuration, suggestionFor, thisWeek, toggleFavourite, youtubeIdFrom, type Meditation, type Watched } from '../meditation/library';

const mine: Meditation = { id: 'abcdefghijk', name: 'Mine', description: '', duration: '00:10:00', note: '#meditation(00:10:00)', youtubeId: 'abcdefghijk', userDefined: true };

describe('the built-in meditations', () => {
  it('are the ten of v1, each with a YouTube id and a note', () => {
    expect(BUILT_IN.length).toBe(10);
    for (const m of BUILT_IN) {
      expect(m.youtubeId).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(m.note).toContain('#meditation');
    }
  });

  it('the list of the user comes first, and a built-in one with the same id is not listed twice', () => {
    const list = allMeditations([{ ...mine, id: BUILT_IN[0].id, youtubeId: BUILT_IN[0].id }]);
    expect(list.filter((m) => m.id === BUILT_IN[0].id)).toHaveLength(1);
    expect(list[0].userDefined).toBe(true);
  });
});

describe('durations', () => {
  it('reads hh:mm and hh:mm:ss, and rejects anything else', () => {
    expect(parseDuration('00:10')).toBe(600);
    expect(parseDuration('00:02:30')).toBe(150);
    expect(parseDuration('10 minutes')).toBeUndefined();
  });

  it('writes a duration as hh:mm:ss', () => {
    expect(formatDuration(3725)).toBe('01:02:05');
  });
});

describe('the meditations the user adds', () => {
  it('a name, a duration, a YouTube id and a note are needed', () => {
    expect(meditationProblem({ ...mine, name: ' ' })).toBeTruthy();
    expect(meditationProblem({ ...mine, duration: '10' })).toBeTruthy();
    expect(meditationProblem({ ...mine, youtubeId: 'short' })).toBeTruthy();
    expect(meditationProblem({ ...mine, note: '' })).toBeTruthy();
    expect(meditationProblem(mine)).toBeNull();
  });

  it('a link is turned into its YouTube id', () => {
    expect(youtubeIdFrom('https://www.youtube.com/watch?v=41DEKf4KWdU&t=3')).toBe('41DEKf4KWdU');
    expect(youtubeIdFrom('https://youtu.be/41DEKf4KWdU')).toBe('41DEKf4KWdU');
    expect(youtubeIdFrom(' 41DEKf4KWdU ')).toBe('41DEKf4KWdU');
  });

  it('a saved one that is not well formed is left out', () => {
    const kept = normaliseCustom([mine, { name: 'Bad', duration: 'x', youtubeId: 'abcdefghijk', note: 'n' }]);
    expect(kept.map((m) => m.name)).toEqual(['Mine']);
  });
});

describe('favourites, the week and the suggestion', () => {
  it('a favourite is added once and removed the next time', () => {
    expect(toggleFavourite([], 'a')).toEqual(['a']);
    expect(toggleFavourite(['a'], 'a')).toEqual([]);
  });

  it('the week counts the watched meditations since Monday, and their minutes', () => {
    const wednesday = new Date(2026, 9, 21, 12);
    const watched: Watched[] = [
      { id: 'a', at: new Date(2026, 9, 20, 8).toISOString(), seconds: 600 },
      { id: 'b', at: new Date(2026, 9, 12, 8).toISOString(), seconds: 300 },
    ];
    expect(thisWeek(watched, wednesday)).toEqual({ count: 1, minutes: 10 });
  });

  it('suggests a favourite that was not watched in the last week, and an unwatched one otherwise', () => {
    const now = new Date(2026, 9, 21, 12);
    const list = [mine, BUILT_IN[0]];
    const recent: Watched[] = [{ id: mine.id, at: new Date(2026, 9, 20).toISOString(), seconds: 60 }];
    expect(suggestionFor(list, [BUILT_IN[0].id, mine.id], recent, now, () => 0)?.id).toBe(BUILT_IN[0].id);
    expect(suggestionFor(list, [], [], now, () => 0)?.id).toBe(mine.id);
  });
});

describe('the note', () => {
  it('is the note of the meditation with its YouTube id and the care tag, scored 3, as v1 wrote it', () => {
    expect(noteFor(mine)).toEqual({ note: '#meditation(00:10:00) +yt_abcdefghijk +care', score: 3 });
  });
});
