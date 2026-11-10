<script lang="ts">
  import { onMount } from 'svelte';
  import { meditate } from './meditation/state.svelte';
  import type { Meditation } from './meditation/library';
  import { paletteFrom, glassFrom, tintTextFrom, type Palette, type Glass, dangerTextFrom } from './palette';
  import { onPrefsChange } from './prefs-live';
  import List from './screens/list.svelte';
  import Player from './screens/player.svelte';
  import Editor from './screens/editor.svelte';

  type View = { name: 'list' } | { name: 'add' } | { name: 'edit'; meditation: Meditation } | { name: 'settings' };

  let view = $state<View>({ name: 'list' });
  let palette = $state<Palette>(paletteFrom(undefined));
  let dangerText = $state(dangerTextFrom(undefined));
  let glass = $state<Glass>(glassFrom(undefined));
  let tintText = $state(tintTextFrom(undefined));
  let scale = $state(1);

  const applyNomieValues = (plugin: any) => {
    if (!plugin?.prefs) return;
    palette = paletteFrom(plugin.prefs);
    dangerText = dangerTextFrom(plugin.prefs);
    glass = glassFrom(plugin.prefs);
    tintText = tintTextFrom(plugin.prefs);
    scale = plugin.prefs.fontScale || 1;
  };

  const createTracker = () => {
    meditate.plugin.openTrackableEditor({
      type: 'tracker',
      tag: '#meditation',
      tracker: { id: 'meditation', type: 'timer', label: 'Meditation', emoji: '🧘🏽‍♀️' },
    });
  };

  onMount(() => {
    const plugin = new NomiePlugin({
      name: 'Nomie Meditate',
      emoji: '🧘🏽‍♀️',
      description: 'Guided meditations from YouTube, with favourites, a suggestion for today, and a log to Nomie.',
      uses: ['createNote', 'confirm', 'openURL', 'openTrackableEditor', 'getStorageItem', 'setStorageItem'],
      version: '2.0',
      addToCaptureMenu: true,
      addToMoreMenu: true,
      addToWidgets: false,
    });
    meditate.plugin = plugin;
    onPrefsChange(plugin, () => applyNomieValues(plugin));
    plugin.onRegistered(async () => {
      applyNomieValues(plugin);
      if (!meditate.loaded) await meditate.load(plugin);
    });
    plugin.onUIOpened(async () => {
      applyNomieValues(plugin);
      if (!meditate.loaded) await meditate.load(plugin);
    });
  });
</script>

<div class="root" style="--page: {palette.page}; --card: {palette.card}; --card-inner: {palette.cardInner}; --text: {palette.text}; --muted: {palette.textSecondary}; --line: {palette.separator}; --fill: {palette.fill}; --tint: {palette.tint}; --on-tint: {palette.onTint}; --tint-soft: {palette.tintSoft}; --good: {palette.good}; --danger: {dangerText}; --glass-fill: {glass.fill}; --glass-edge: {glass.edge}; --glass-blur: {glass.blur}; --glass-shadow: {glass.shadow}; --tint-text: {tintText}; --scale: {scale};">
  <header class="top">
    <div class="title">
      <span aria-hidden="true">🧘🏽‍♀️</span>
      <h1>Meditate</h1>
    </div>
    {#if !meditate.current && view.name !== 'settings'}
      <button class="icon" aria-label="Settings" onclick={() => (view = { name: 'settings' })}>⚙︎</button>
    {/if}
  </header>

  {#if !meditate.loaded}
    <p class="muted">Loading…</p>
  {:else if meditate.current}
    <Player meditation={meditate.current} />
  {:else if view.name === 'settings'}
    <section class="card">
      <p class="caption">Timeline</p>
      <div class="row">
        <span>Ask before logging</span>
        <button class="toggle" class:on={meditate.askBeforeLog} aria-pressed={meditate.askBeforeLog} aria-label="Ask before logging" onclick={() => meditate.setAskBeforeLog(!meditate.askBeforeLog)}></button>
      </div>
      <p class="hint">A finished meditation is written with #meditation(duration) and the care tag, so it shows in your timeline and in the tracker.</p>
      <button class="chip" onclick={createTracker}>Create the Meditation tracker</button>
    </section>
    <section class="card">
      <p class="muted">{meditate.watched.length} meditations in your history.</p>
      <button class="link danger" onclick={() => meditate.clearWatched()}>Clear the history</button>
    </section>
    <button class="ghost" onclick={() => (view = { name: 'list' })}>Back</button>
  {:else if view.name === 'add'}
    <Editor meditation={null} isNew={true} done={() => (view = { name: 'list' })} />
  {:else if view.name === 'edit'}
    <Editor meditation={view.meditation} isNew={false} done={() => (view = { name: 'list' })} />
  {:else}
    <List open={(m) => meditate.play(m)} add={() => (view = { name: 'add' })} />
    {#each meditate.library.filter((m) => m.userDefined) as m (m.id)}
      <button class="edit-link" onclick={() => (view = { name: 'edit', meditation: m })}>Edit “{m.name}”</button>
    {/each}
  {/if}
</div>

<style>
  .root { box-sizing: border-box; min-height: 100vh; max-width: 520px; margin: 0 auto; padding: 16px; background: var(--page); color: var(--text); font-size: calc(16px * var(--scale)); line-height: 1.4; }
  /* the plugin page fills the frame, so the glass bar sits at the top edge */
  /* the app's text: its iOS font stack (main.css --ios-font), with the app's smoothing */
  :global(body) { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  /* the header is a Liquid Glass bar (D-glass): it stays at the top and the content scrolls under it */
  .top { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; margin: -16px -16px 8px; padding: 16px 16px 10px; background: var(--glass-fill); -webkit-backdrop-filter: var(--glass-blur); backdrop-filter: var(--glass-blur); border-bottom: 1px solid var(--glass-edge); }
  .title { display: flex; align-items: center; gap: 8px; }
  h1 { margin: 0; font-size: calc(22px * var(--scale)); font-weight: 700; }
  /* the icon button sits in the glass header, so it is a solid fill (glass never sits on glass) */
  .icon { width: 36px; height: 36px; border: 0; border-radius: 50%; background: var(--fill); color: var(--text); font-size: calc(17px * var(--scale)); cursor: pointer; }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); }
  .card { padding: 14px 16px; border-radius: 16px; background: var(--card); margin: 12px 0; }
  .caption { margin: 0 0 6px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; }
  .hint { font-size: calc(13px * var(--scale)); color: var(--muted); }
  .toggle { position: relative; width: 50px; height: 30px; border: 0; border-radius: 15px; background: var(--fill); cursor: pointer; }
  .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; border-radius: 50%; background: #fff; transition: transform 0.15s; }
  .toggle.on { background: var(--tint); }
  .toggle.on::after { transform: translateX(20px); }
  .chip { margin-top: 8px; padding: 8px 12px; border: 0; border-radius: 10px; background: var(--fill); color: var(--tint-text); font: inherit; cursor: pointer; }
  .link { padding: 6px 0; border: 0; background: transparent; font: inherit; cursor: pointer; color: var(--tint); }
  .danger { color: var(--danger); }
  .ghost { display: block; width: 100%; margin-top: 8px; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
  .edit-link { display: block; margin: 4px 0; padding: 6px 0; border: 0; background: transparent; color: var(--tint); font: inherit; cursor: pointer; }
</style>
