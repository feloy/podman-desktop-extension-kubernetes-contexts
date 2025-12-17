<script lang="ts">
import type { Cluster, User } from '@kubernetes/client-node';
import ContextCardLine from '/@/component/ContextCardLine.svelte';
import SetCurrentContextAction from '/@/component/actions/SetCurrentContextAction.svelte';
import DeleteContextAction from '/@/component/actions/DeleteContextAction.svelte';
import DuplicateContextAction from '/@/component/actions/DuplicateContextAction.svelte';
import EditContextAction from '/@/component/actions/EditContextAction.svelte';
import type { ContextHealth } from '@podman-desktop/kubernetes-dashboard-extension-api';
import ContextStatus from '/@/component/ContextStatus.svelte';

interface Props {
  cluster: Cluster;
  user: User;
  name: string;
  namespace?: string;
  currentContext: boolean;
  health?: ContextHealth;
  icon: string;
  onEdit: () => void;
}

const { cluster, user, name, namespace, currentContext, health, icon, onEdit }: Props = $props();
</script>

<div role="row" aria-label={name} class="bg-(--pd-content-card-bg) mb-5 rounded-md p-3 flex-nowrap">
  <div class="pb-2">
    <div class="pb-2 flex">
      <img src={icon} aria-label="Context Logo" alt="{name} logo" class="max-w-[40px] h-full" />
      <div class="pl-3 grow flex flex-col justify-center">
        <div class="flex flex-col items-left">
          {#if currentContext}
            <span class="text-sm text-(--pd-content-card-text)" aria-label="Current Context">Current Context</span>
          {/if}
          <span class="font-semibold text-(--pd-content-card-header-text)" aria-label="Context Name">{name}</span>
        </div>
      </div>
      {#if !currentContext}
        <SetCurrentContextAction name={name} />
      {/if}
      <DuplicateContextAction name={name} />
      <EditContextAction onEdit={onEdit} />
      <DeleteContextAction name={name} />
    </div>
  </div>
  <div class="grow flex-column divide-gray-900 text-(--pd-content-card-text)">
    <div class="flex flex-row">
      <div class="flex-none w-36">
        <div class="flex flex-col space-y-2">
          <div class="flex flex-row pt-2">
            <ContextStatus health={health} />
          </div>
        </div>
      </div>
      <div class="grow text-sm">
        <ContextCardLine title="CLUSTER" value={cluster.name} label="Context Cluster" />
        {#if cluster.server !== undefined}
          <ContextCardLine title="SERVER" value={cluster.server} label="Context Server" />
        {/if}
        <ContextCardLine title="USER" value={user.name} label="Context User" />
        {#if namespace}
          <ContextCardLine title="NAMESPACE" value={namespace} label="Context Namespace" />
        {/if}
      </div>
    </div>
  </div>
</div>
