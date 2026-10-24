// The state of the plugin: the meditations, favourites, what was watched, and the one playing.
import { allMeditations, meditationProblem, noteFor, normaliseCustom, toggleFavourite, type Meditation, type Watched } from './library';

class MeditateState {
  plugin: any = null;
  loaded = $state(false);
  custom = $state<Meditation[]>([]);
  favourites = $state<string[]>([]);
  watched = $state<Watched[]>([]);
  askBeforeLog = $state(true);

  // the meditation that is playing or waiting to be logged
  current = $state<Meditation | null>(null);
  finished = $state(false);
  logged = $state(false);

  get library(): Meditation[] {
    return allMeditations(this.custom);
  }

  async load(plugin: any): Promise<void> {
    this.plugin = plugin;
    await plugin.storage.init();
    this.custom = normaliseCustom(plugin.storage.getItem('custom'));
    this.favourites = plugin.storage.getItem('favourites') ?? [];
    this.watched = plugin.storage.getItem('watched') ?? [];
    this.askBeforeLog = plugin.storage.getItem('askBeforeLog') ?? true;
    this.loaded = true;
  }

  private save(key: string, value: unknown): void {
    this.plugin?.storage.setItem(key, $state.snapshot(value));
  }

  toggleFavourite(id: string): void {
    this.favourites = toggleFavourite(this.favourites, id);
    this.save('favourites', this.favourites);
  }

  saveCustom(m: Meditation): string | null {
    const problem = meditationProblem(m);
    if (problem) return problem;
    const next = { ...$state.snapshot(m), name: m.name.trim(), youtubeId: m.youtubeId.trim(), id: m.youtubeId.trim(), userDefined: true };
    const exists = this.custom.some((c) => c.id === next.id);
    this.custom = exists ? this.custom.map((c) => (c.id === next.id ? next : c)) : [...this.custom, next];
    this.save('custom', this.custom);
    return null;
  }

  async deleteCustom(id: string): Promise<boolean> {
    const res = await this.plugin.confirm('Delete this meditation?', 'It is removed from your list. Your timeline is not changed.');
    if (!res?.value) return false;
    this.custom = this.custom.filter((c) => c.id !== id);
    this.save('custom', this.custom);
    return true;
  }

  play(m: Meditation): void {
    this.current = m;
    this.finished = false;
    this.logged = false;
  }

  // The meditation is over: it is kept as watched, and logged when the settings say so
  markFinished(): void {
    if (!this.current || this.finished) return;
    const seconds = Math.round(this.lengthOf(this.current));
    this.finished = true;
    this.watched = [{ id: this.current.id, at: new Date().toISOString(), seconds }, ...this.watched].slice(0, 500);
    this.save('watched', this.watched);
    if (!this.askBeforeLog) this.log();
  }

  lengthOf(m: Meditation): number {
    const [h, mi, s = '0'] = m.duration.split(':');
    return Number(h) * 3600 + Number(mi) * 60 + Number(s);
  }

  log(): void {
    if (!this.current || this.logged) return;
    this.plugin.createNote(noteFor(this.current));
    this.logged = true;
  }

  setAskBeforeLog(value: boolean): void {
    this.askBeforeLog = value;
    this.save('askBeforeLog', value);
  }

  async clearWatched(): Promise<void> {
    const res = await this.plugin.confirm('Clear the watched list?', 'The history of meditations is removed. Your timeline is not changed.');
    if (!res?.value) return;
    this.watched = [];
    this.save('watched', []);
  }

  stop(): void {
    this.current = null;
    this.finished = false;
    this.logged = false;
  }
}

export const meditate = new MeditateState();
