<script lang="ts">
import { getContext, onDestroy, onMount } from 'svelte';
import { States } from '/@/state/states';
import { Button, EmptyScreen, NavPage } from '@podman-desktop/ui-svelte';
import ContextCard from '/@/component/ContextCard.svelte';
import { kubernetesIconBase64 } from './KubeIcon';
import type { Context } from '@kubernetes/client-node';
import EditModal from '/@/component/EditModal.svelte';
import type { Unsubscriber } from 'svelte/store';
import ImportModal from '/@/component/ImportModal.svelte';
import { faFileImport } from '@fortawesome/free-solid-svg-icons';
import KubeIcon from '/@/component/icons/KubeIcon.svelte';

const DISPLAYED_RESOURCES = ['deployments', 'pods'];
const states = getContext<States>(States);
const availableContexts = states.stateAvailableContextsInfoUI;
const contextsHealths = states.stateContextsHealthsInfoUI;
const contextsPermissions = states.stateContextsPermissionsInfoUI;
const resourcesCount = states.stateResourcesCountInfoUI;

let contextToEdit = $state<Context>();
let subscribers: Unsubscriber[] = [];
let importModalVisible = $state(false);

onMount(() => {
  subscribers.push(availableContexts.subscribe());
  subscribers.push(contextsHealths.subscribe());
  subscribers.push(contextsPermissions.subscribe());
  subscribers.push(resourcesCount.subscribe());
});

onDestroy(() => {
  for (const subscriber of subscribers) {
    subscriber();
  }
  subscribers = [];
});

function onEdit(context: Context): void {
  contextToEdit = context;
}

function closeEditModal(): void {
  contextToEdit = undefined;
}

function closeImportModal(): void {
  importModalVisible = false;
}

function openImportModal(): void {
  importModalVisible = true;
}
</script>

<main class="overflow-hidden bg-(--pd-content-bg) text-base h-screen w-screen">
  <NavPage searchEnabled={false} title="Kubernetes Contexts">
    {#snippet additionalActions()}
      <Button type="primary" icon={faFileImport} onclick={openImportModal}>Import</Button>
    {/snippet}
    {#snippet content()}
      <div class="mx-5 w-full">
        {#if (availableContexts?.data?.contexts?.length ?? 0) === 0}
          <EmptyScreen
            aria-label="No Resource Panel"
            icon={KubeIcon}
            title="No Kubernetes contexts found"
            message="Check that Kubernetes context is created and selected. You can create local Kubernetes cluster from Podman Desktop.">
          </EmptyScreen>
        {/if}
        {#if availableContexts.data}
          <div class="h-full" role="table" aria-label="Contexts">
            {#each availableContexts.data.contexts as context, index (index)}
              {@const cluster = availableContexts.data.clusters.find(cluster => cluster.name === context.cluster)}
              {@const user = availableContexts.data.users.find(user => user.name === context.user)}
              {#if cluster && user}
                <ContextCard
                  health={contextsHealths.data?.healths.find(health => health.contextName === context.name)}
                  resourcesCount={resourcesCount.data?.counts.filter(
                    count => count.contextName === context.name && DISPLAYED_RESOURCES.includes(count.resourceName),
                  )}
                  contextsPermissions={contextsPermissions.data?.permissions.filter(
                    permission =>
                      permission.contextName === context.name && DISPLAYED_RESOURCES.includes(permission.resourceName),
                  )}
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

          {#if importModalVisible}
            <ImportModal closeCallback={closeImportModal} />
          {/if}
        {/if}
      </div>
    {/snippet}
  </NavPage>
</main>
