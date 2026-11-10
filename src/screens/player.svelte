<script lang="ts">
  import { t } from '../i18n/index.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { meditate } from '../meditation/state.svelte';
  import type { Meditation } from '../meditation/library';

  let { meditation }: { meditation: Meditation } = $props();

  let host = $state<HTMLDivElement | undefined>(undefined);
  let player: any = null;
  let failed = $state(false);

  // The YouTube player reports when the video ends, so the meditation can be marked as finished
  const loadApi = (): Promise<void> =>
    new Promise((resolve) => {
      const w = window as any;
      if (w.YT?.Player) return resolve();
      const previous = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      if (!document.querySelector('script[data-youtube-api]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.dataset.youtubeApi = 'true';
        script.onerror = () => (failed = true);
        document.head.appendChild(script);
      }
    });

  onMount(async () => {
    try {
      await loadApi();
      const w = window as any;
      player = new w.YT.Player(host, {
        videoId: meditation.youtubeId,
        width: '100%',
        height: '100%',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: any) => {
            if (e.data === 0) meditate.markFinished();
          },
          onError: () => (failed = true),
        },
      });
    } catch {
      failed = true;
    }
  });

  onDestroy(() => {
    player?.destroy?.();
  });

  const openOnYouTube = () => meditate.plugin.openURL(`https://www.youtube.com/watch?v=${meditation.youtubeId}`, meditation.name);
</script>

<div class="player">
  <div class="frame" bind:this={host}></div>
  {#if failed}
    <p class="muted">{t('noVideo')}</p>
    <button class="ghost" onclick={openOnYouTube}>{t('openYt')}</button>
  {/if}
</div>

<section class="card">
  <p class="caption">{meditation.duration}</p>
  <h2>{meditation.name}</h2>
  {#if meditation.description}<p class="muted">{meditation.description}</p>{/if}
</section>

{#if meditate.finished}
  <section class="card done">
    <h3>{t('wellDone')}</h3>
    {#if meditate.logged}
      <p class="notice">{t('loggedToTimeline')}</p>
    {:else}
      <p class="muted">{t('logPrompt')}</p>
      <button class="primary" onclick={() => meditate.log()}>{t('logToTimeline')}</button>
    {/if}
  </section>
  <button class="ghost" onclick={() => meditate.stop()}>{t('backToList')}</button>
{:else}
  <div class="actions">
    <button class="ghost" onclick={() => meditate.stop()}>{t('back')}</button>
    <button class="primary" onclick={() => meditate.markFinished()}>{t('iFinished')}</button>
  </div>
{/if}

<style>
  .frame { width: 100%; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden; background: #000; }
  .frame :global(iframe) { width: 100%; height: 100%; border: 0; }
  .card { padding: 14px 16px; border-radius: 16px; background: var(--card); margin: 12px 0; }
  .card h2 { margin: 2px 0 4px; font-size: calc(20px * var(--scale)); }
  .card h3 { margin: 0; font-size: calc(18px * var(--scale)); }
  .caption { margin: 0; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .muted { color: var(--muted); font-size: calc(15px * var(--scale)); }
  .actions { display: flex; gap: 8px; }
  .primary { flex: 1; margin-top: 8px; padding: 14px; border: 0; border-radius: 14px; background: var(--tint); color: var(--on-tint); font: inherit; font-weight: 600; cursor: pointer; }
  .ghost { flex: 1; display: block; width: 100%; margin-top: 8px; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
  .done { border: 1px solid var(--good); }
  .notice { color: var(--good); font-weight: 600; margin: 6px 0 0; }
</style>
