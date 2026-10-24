<script lang="ts">
  import { meditate } from '../meditation/state.svelte';
  import { suggestionFor, thisWeek, type Meditation } from '../meditation/library';

  let { open, add }: { open: (m: Meditation) => void; add: () => void } = $props();

  let onlyFavourites = $state(false);
  const week = $derived(thisWeek(meditate.watched, new Date()));
  const shown = $derived(meditate.library.filter((m) => !onlyFavourites || meditate.favourites.includes(m.id)));
  const today = $derived(suggestionFor(meditate.library, meditate.favourites, meditate.watched, new Date()));
</script>

<section class="card week">
  <p class="caption">This week</p>
  <p class="big">{week.count} <span class="muted">{week.count === 1 ? 'meditation' : 'meditations'}</span></p>
  <p class="muted">{week.minutes} minutes</p>
</section>

{#if today}
  <section class="card suggest">
    <p class="caption">For today</p>
    <p class="title">{today.name}</p>
    <p class="muted">{today.duration}</p>
    <button class="primary" onclick={() => open(today)}>Play</button>
  </section>
{/if}

<div class="filters">
  <button class:on={!onlyFavourites} aria-pressed={!onlyFavourites} onclick={() => (onlyFavourites = false)}>All</button>
  <button class:on={onlyFavourites} aria-pressed={onlyFavourites} onclick={() => (onlyFavourites = true)}>Favourites</button>
</div>

{#each shown as m (m.id)}
  <div class="row">
    <button class="item" onclick={() => open(m)}>
      <span class="text">
        <span class="title">{m.name}</span>
        <span class="muted">{m.duration}{m.description ? ` · ${m.description}` : ''}</span>
      </span>
    </button>
    <button class="star" class:on={meditate.favourites.includes(m.id)} aria-label={meditate.favourites.includes(m.id) ? 'Remove from favourites' : 'Add to favourites'} onclick={() => meditate.toggleFavourite(m.id)}>
      {meditate.favourites.includes(m.id) ? '★' : '☆'}
    </button>
  </div>
{:else}
  <p class="muted pad">No meditations in this list yet.</p>
{/each}

<button class="ghost" onclick={add}>Add a meditation</button>

<style>
  .card { padding: 14px 16px; border-radius: 16px; background: var(--card); margin: 12px 0; }
  .week p { margin: 0; }
  .caption { font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .big { font-size: calc(26px * var(--scale)); font-weight: 700; }
  .title { font-weight: 600; margin: 4px 0 0; }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); }
  .pad { padding: 12px 0; }
  .suggest .primary { margin-top: 10px; padding: 10px 16px; border: 0; border-radius: 12px; background: var(--tint); color: var(--on-tint); font: inherit; font-weight: 600; cursor: pointer; }
  .filters { display: flex; gap: 8px; margin: 14px 0 6px; }
  .filters button { padding: 8px 14px; border: 0; border-radius: 10px; background: var(--fill); color: var(--text); font: inherit; cursor: pointer; }
  .filters button.on { background: var(--tint-soft); color: var(--tint); font-weight: 600; }
  .row { display: flex; align-items: center; gap: 8px; border-top: 1px solid var(--line); }
  .item { flex: 1; min-width: 0; padding: 12px 0; border: 0; background: transparent; color: var(--text); font: inherit; text-align: left; cursor: pointer; }
  .text { display: flex; flex-direction: column; }
  .star { border: 0; background: transparent; color: var(--muted); font-size: calc(22px * var(--scale)); cursor: pointer; padding: 6px; }
  .star.on { color: var(--tint); }
  .ghost { display: block; width: 100%; margin-top: 14px; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
</style>
