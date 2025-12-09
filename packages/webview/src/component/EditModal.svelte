<script lang="ts">
import type { Cluster, Context, User } from '@kubernetes/client-node';
import { Button, Dropdown, ErrorMessage, Input } from '@podman-desktop/ui-svelte';
import { getContext, onMount } from 'svelte';

import Dialog from '/@/component/dialog/Dialog.svelte';
import { Remote } from '/@/remote/remote';
import { API_CONTEXTS } from '@kubernetes-contexts/channels';

interface Props {
  contexts: Context[];
  users: User[];
  clusters: Cluster[];
  contextToEdit: Context;
  closeCallback: () => void;
}

let { contexts, users, clusters, contextToEdit, closeCallback }: Props = $props();

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);

// The context name given by the user
let contextName = $state('');
// The context namespace given by the user
let contextNamespace = $state('');
// The context cluster given by the user
let contextCluster = $state('');
// The context user given by the user
let contextUser = $state('');

let contextNameErrorMessage = $derived.by(() => {
  const context = contexts.find(ctx => ctx.name === contextName);
  // Show error when is the new name identical with any other context name in the kubeConfig
  if (context && context.name !== contextToEdit.name) {
    return `This context name already exists in the list of contexts`;
  } else if (contextName === '') {
    return 'Please enter a value';
  } else {
    return '';
  }
});

let saveDisabled = $derived.by(() => {
  // Name is invalid when:
  // 1. is empty
  // 2. is default value (without change)
  // 3. current name is same as other context name in kubeconfig
  const invalidName =
    contextName.trim() === '' ||
    contexts.find(ctx => ctx.name === contextName) !== undefined ||
    contextName === contextToEdit.name;
  const sameNamespace = contextNamespace === (contextToEdit.namespace ?? '');
  const sameCluster = contextCluster === contextToEdit.cluster;
  const sameUser = contextUser === contextToEdit.user;
  return invalidName && sameNamespace && sameCluster && sameUser;
});

onMount(async () => {
  contextName = contextToEdit.name;
  contextNamespace = contextToEdit.namespace ?? '';
  contextCluster = contextToEdit.cluster;
  contextUser = contextToEdit.user;
});

async function editContext(): Promise<void> {
  await contextsApi.editContext(contextToEdit.name, {
    name: contextName,
    namespace: contextNamespace,
    user: contextUser,
    cluster: contextCluster,
  });
  closeCallback();
}

function onClusterStateChange(key: unknown): void {
  const entry = clusters?.find(val => val.name === key);
  if (entry) {
    contextCluster = entry.name;
  }
}

function onUserStateChange(key: unknown): void {
  const entry = users?.find(val => val.name === key);
  if (entry) {
    contextUser = entry.name;
  }
}
</script>

<Dialog title="Edit Context" onclose={closeCallback}>
  {#snippet content()}
    <div class="w-full">
      <label for="contextName" class="block my-2 text-sm font-bold text-(--pd-modal-text)">Name</label>
      <Input
        bind:value={contextName}
        name="contextName"
        id="contextName"
        placeholder="Enter context name (e.g. kind-context-name-1)"
        aria-invalid={contextNameErrorMessage !== ''}
        aria-label="contextName"
        required />
      {#if contextNameErrorMessage}
        <ErrorMessage error={contextNameErrorMessage} />
      {/if}

      <label for="contextCluster" class="block my-2 text-sm font-bold text-(--pd-modal-text)">Cluster</label>
      <Dropdown
        class="text-sm"
        id="contextCluster"
        onChange={onClusterStateChange}
        value={contextCluster}
        options={clusters?.map(cluster => ({
          value: cluster.name,
          label: cluster.name,
        }))}>
      </Dropdown>

      <label for="contextUser" class="block my-2 text-sm font-bold text-(--pd-modal-text)">User</label>
      <Dropdown
        class="text-sm"
        id="contextUser"
        onChange={onUserStateChange}
        value={contextUser}
        options={users?.map(user => ({
          value: user.name,
          label: user.name,
        }))}>
      </Dropdown>

      <label for="contextNamespace" class="block my-2 text-sm font-bold text-(--pd-modal-text)">Namespace</label>
      <Input
        bind:value={contextNamespace}
        name="contextNamespace"
        id="contextNamespace"
        placeholder="Enter context namespace (e.g. production)"
        aria-label="contextNamespace"
        required />
    </div>
  {/snippet}
  {#snippet buttons()}
    <Button class="pcol-start-3" type="link" onclick={closeCallback}>Cancel</Button>
    <Button class="col-start-4" disabled={saveDisabled} onclick={editContext}>Save</Button>
  {/snippet}
</Dialog>
