<script lang="ts">
  import { meditate } from '../meditation/state.svelte';
  import { formatDuration, meditationProblem, parseDuration, youtubeIdFrom, type Meditation } from '../meditation/library';

  let { meditation, isNew, done }: { meditation: Meditation | null; isNew: boolean; done: () => void } = $props();

  // a working copy; a new meditation starts with the most used duration of the classic ones
  // svelte-ignore state_referenced_locally
  let draft = $state({
    id: meditation?.id ?? '',
    name: meditation?.name ?? '',
    description: meditation?.description ?? '',
    duration: meditation?.duration ?? '00:10:00',
    note: meditation?.note ?? '#meditation(00:10:00)',
    youtubeId: meditation?.youtubeId ?? '',
    userDefined: true,
  });
  let problem = $state<string | null>(null);

  // the note follows the duration until the user changes the note
  // svelte-ignore state_referenced_locally
  let noteTouched = $state(!meditation);
  $effect(() => {
    if (!noteTouched) draft.note = `#meditation(${draft.duration})`;
  });

  const save = () => {
    const seconds = parseDuration(draft.duration);
    const error = meditate.saveCustom({
      ...draft,
      youtubeId: youtubeIdFrom(draft.youtubeId),
      duration: seconds === undefined ? draft.duration : formatDuration(seconds),
    } as Meditation);
    problem = error;
    if (!error) done();
  };
  const remove = async () => {
    if (await meditate.deleteCustom(draft.id)) done();
  };
  const current = $derived(meditationProblem({ ...draft, youtubeId: youtubeIdFrom(draft.youtubeId) }));
</script>

<h2>{isNew ? 'New meditation' : 'Edit meditation'}</h2>

<section class="card">
  <label class="field"><span class="muted">Name</span><input class="input" bind:value={draft.name} placeholder="Morning calm" /></label>
  <label class="field"><span class="muted">Description</span><textarea class="input" rows="2" bind:value={draft.description}></textarea></label>
  <label class="field"><span class="muted">YouTube link or id</span><input class="input" bind:value={draft.youtubeId} placeholder="https://youtu.be/…" /></label>
  <label class="field"><span class="muted">Duration (hh:mm:ss)</span><input class="input" bind:value={draft.duration} inputmode="numeric" /></label>
  <label class="field">
    <span class="muted">Note in your timeline</span>
    <input class="input" bind:value={draft.note} oninput={() => (noteTouched = true)} />
    <span class="hint">The tracker is written as #meditation(duration), and the teacher with @name.</span>
  </label>
</section>

{#if problem}<p class="problem">{problem}</p>{:else if current}<p class="muted small">{current}</p>{/if}

<button class="primary" onclick={save} disabled={!!current}>Save</button>
<div class="row-buttons">
  {#if !isNew}<button class="ghost danger" onclick={remove}>Delete</button>{/if}
  <button class="ghost" onclick={done}>Cancel</button>
</div>

<style>
  h2 { margin: 12px 0 8px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .card { padding: 12px 16px; border-radius: 16px; background: var(--card); }
  .field { display: flex; flex-direction: column; gap: 4px; padding: 6px 0; }
  .hint { font-size: calc(13px * var(--scale)); color: var(--muted); }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); }
  .small { font-size: calc(13px * var(--scale)); }
  .input { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 0; border-radius: 12px; background: var(--card-inner, var(--fill)); color: var(--text); font: inherit; }
  .problem { color: var(--danger); font-weight: 600; }
  .primary { display: block; width: 100%; margin-top: 14px; padding: 14px; border: 0; border-radius: 14px; background: var(--tint); color: var(--on-tint); font: inherit; font-weight: 600; cursor: pointer; }
  .primary:disabled { opacity: 0.4; }
  .row-buttons { display: flex; gap: 8px; margin-top: 8px; }
  .ghost { flex: 1; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
  .danger { color: var(--danger); }
</style>
