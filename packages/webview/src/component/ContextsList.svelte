<script lang="ts">
import { getContext, onMount } from 'svelte';
import { States } from '/@/state/states';
import { NavPage } from '@podman-desktop/ui-svelte';
import ContextCard from '/@/component/ContextCard.svelte';
import { kubernetesIconBase64 } from './KubeIcon';
import type { Context } from '@kubernetes/client-node';
import EditModal from '/@/component/EditModal.svelte';

const states = getContext<States>(States);
const availableContexts = states.stateAvailableContextsInfoUI;

let contextToEdit = $state<Context>();

onMount(() => {
  return availableContexts.subscribe();
});

function onEdit(context: Context): void {
  contextToEdit = context;
}

function closeEditModal(): void {
  contextToEdit = undefined;
}
</script>

<main class="overflow-hidden bg-(--pd-content-bg) text-base">
  <NavPage searchEnabled={false} title="Kubernetes Contexts">
    {#snippet content()}
      <div class="mx-5 w-full">
        {#if availableContexts.data}
          <div class="h-full" role="table" aria-label="Contexts">
            {#each availableContexts.data.contexts as context, index (index)}
              {@const cluster = availableContexts.data.clusters.find(cluster => cluster.name === context.cluster)}
              {@const user = availableContexts.data.users.find(user => user.name === context.user)}
              {#if cluster && user}
                <ContextCard
                  cluster={cluster}
                  user={user}
                  name={context.name}
                  namespace={context.namespace}
                  currentContext={context.name === availableContexts.data.currentContext}
                  icon={kubernetesIconBase64}
                  onEdit={onEdit.bind(undefined, context)} />
              {/if}
            {/each}
          </div>
          {#if contextToEdit}
            <EditModal
              contexts={availableContexts.data.contexts}
              users={availableContexts.data.users}
              clusters={availableContexts.data.clusters}
              contextToEdit={contextToEdit}
              closeCallback={closeEditModal} />
          {/if}
        {/if}
      </div>
    {/snippet}
  </NavPage>
</main>
