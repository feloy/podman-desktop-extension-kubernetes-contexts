<script lang="ts">
import type { ContextPermission, ResourceCount } from '@podman-desktop/kubernetes-dashboard-extension-api';
import { Tooltip } from '@podman-desktop/ui-svelte';
import Fa from 'svelte-fa';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';

interface Props {
  resourcesCount?: ResourceCount[];
  contextsPermissions?: ContextPermission[];
}

const { resourcesCount, contextsPermissions }: Props = $props();

function permitted(resourceName: string): boolean {
  return (
    contextsPermissions?.some(permission => permission.resourceName === resourceName && permission.permitted) ?? false
  );
}

function count(resourceName: string): string {
  return resourcesCount?.find(count => count.resourceName === resourceName)?.count?.toString() ?? '';
}

function getNotPermittedHelp(podsPermitted: boolean, deploymentsPermitted: boolean): string {
  const notPermitted = [];
  if (!podsPermitted) {
    notPermitted.push('Pods');
  }
  if (!deploymentsPermitted) {
    notPermitted.push('Deployments');
  }
  if (!notPermitted.length) {
    return '';
  }
  return notPermitted.join(' and ') + ' are not accessible';
}
</script>

<div class="flex flex-row items-stretch gap-4 mt-4">
  <div class="text-center">
    <div class="font-bold text-[9px] text-(--pd-invert-content-card-text)" class:opacity-60={!permitted('pods')}>
      PODS
    </div>
    <div
      class="text-[16px] text-(--pd-invert-content-card-text)"
      class:opacity-60={!permitted('pods')}
      aria-label="Context Pods Count">
      {#if permitted('pods')}{count('pods')}{:else}-{/if}
    </div>
  </div>
  <div class="text-center">
    <div class="font-bold text-[9px] text-(--pd-invert-content-card-text)" class:opacity-60={!permitted('deployments')}>
      DEPLOYMENTS
    </div>
    <div
      class="text-[16px] text-(--pd-invert-content-card-text)"
      class:opacity-60={!permitted('deployments')}
      aria-label="Context Deployments Count">
      {#if permitted('deployments')}{count('deployments')}{:else}-{/if}
    </div>
  </div>
  {#if !permitted('pods') || !permitted('deployments')}
    <Tooltip tip={getNotPermittedHelp(permitted('pods'), permitted('deployments'))}
      ><div><Fa size="1x" icon={faQuestionCircle} /></div></Tooltip>
  {/if}
</div>
