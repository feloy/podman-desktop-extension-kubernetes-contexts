<script lang="ts">
import type { ContextHealth } from '@podman-desktop/kubernetes-dashboard-extension-api';
import { Tooltip } from '@podman-desktop/ui-svelte';

interface Props {
  health?: ContextHealth;
}

const { health }: Props = $props();

let errorState = $derived(health?.errorMessage);
let unknownState = $derived(!health);
let reachableState = $derived(health?.reachable && !health?.offline);
let unreachableState = $derived(!health?.reachable && !health?.offline);
let offlineState = $derived(health?.offline);
</script>

{#if errorState}
  <div class="w-3 h-3 rounded-full bg-(--pd-status-dead)"></div>
  <div class="ml-1 text-xs text-(--pd-status-dead)" aria-label="Error">
    <Tooltip>
      <div>ERROR</div>
      {#snippet tipSnippet()}
        <div class="p-2">
          {#if health?.errorMessage}
            {#each health.errorMessage.split('\n').filter(l => l) as line, index (index)}
              <p>{line}</p>
            {/each}
          {/if}
        </div>
      {/snippet}
    </Tooltip>
  </div>
{:else if unknownState}
  <div class="w-3 h-3 rounded-full bg-(--pd-status-disconnected)"></div>
  <div class="ml-1 text-xs text-(--pd-status-disconnected)" aria-label="Context Unknown">UNKNOWN</div>
{:else if reachableState}
  <div class="w-3 h-3 rounded-full bg-(--pd-status-connected)"></div>
  <div class="ml-1 text-xs text-(--pd-status-connected)" aria-label="Context Reachable">REACHABLE</div>
{:else if unreachableState}
  <div class="w-3 h-3 rounded-full bg-(--pd-status-disconnected)"></div>
  <div class="ml-1 text-xs text-(--pd-status-disconnected)" aria-label="Context Unreachable">UNREACHABLE</div>
{:else if offlineState}
  <div class="w-3 h-3 rounded-full bg-(--pd-status-paused)"></div>
  <div class="ml-1 text-xs text-(--pd-status-paused)" aria-label="Context connection lost">CONNECTION LOST</div>
{/if}
