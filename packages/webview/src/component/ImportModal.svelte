<script lang="ts">
import type { ImportContextInfo, OpenDialogResult } from '@kubernetes-contexts/channels';
import { Button, ErrorMessage, Input } from '@podman-desktop/ui-svelte';
import { getContext, onMount } from 'svelte';

import Dialog from '/@/component/dialog/Dialog.svelte';
import ImportContextCard from '/@/component/ImportContextCard.svelte';
import { Remote } from '/@/remote/remote';
import { API_CONTEXTS, API_OPEN_DIALOG, OPEN_DIALOG_RESULTS } from '@kubernetes-contexts/channels';
import { faFileImport, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { States } from '/@/state/states';
import { RpcBrowser } from '@kubernetes-contexts/rpc';

interface Props {
  closeCallback: () => void;
}

let { closeCallback }: Props = $props();

const KEEP_BOTH = 'keep-both';
const REPLACE = 'replace';
const DIALOG_ID = 'import-modal';

type ConflictResolution = typeof KEEP_BOTH | typeof REPLACE;

interface LoadedContext extends ImportContextInfo {
  selected: boolean;
  conflictResolution: ConflictResolution;
}

const rpcBrowser = getContext<RpcBrowser>(RpcBrowser);

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);
const openDialogApi = remote.getProxy(API_OPEN_DIALOG);

const states = getContext<States>(States);
const availableContexts = states.stateAvailableContextsInfoUI;

let errorMessage: string = $state('');
let filePath: string | undefined = $state(undefined);
let loadedContexts: LoadedContext[] = $state([]);
let loading: boolean = $state(false);

onMount(() => {
  // Subscribe to open dialog results broadcast
  const dialogResultUnsubscriber = rpcBrowser.on<OpenDialogResult>(OPEN_DIALOG_RESULTS, (result): void => {
    if (result.id === DIALOG_ID) {
      handleDialogResult(result);
    }
  });
  const availableContextsUnsubscriber = availableContexts.subscribe();

  return (): void => {
    dialogResultUnsubscriber.dispose();
    availableContextsUnsubscriber();
  };
});

function handleDialogResult(result: OpenDialogResult): void {
  if (result.files?.length !== 1) {
    loading = false;
    return;
  }

  filePath = result.files[0];
  loadContextsFromFile().catch((error: unknown): void => {
    console.error(`Error loading contexts from file: ${error}`);
    filePath = undefined;
    loadedContexts = [];
    errorMessage = `Error while selecting config file: ${error}`;
    loading = false;
  });
}

async function openDialog(): Promise<void> {
  errorMessage = '';
  loading = true;
  try {
    // This triggers the dialog and returns immediately
    // The result will be received via the OPEN_DIALOG_RESULT broadcast
    await openDialogApi.openDialog(DIALOG_ID, {
      title: 'Select Kubernetes config file to import',
      selectors: ['openFile'],
      filters: [
        {
          name: 'All files',
          extensions: ['*'],
        },
      ],
    });
  } catch (e) {
    loading = false;
    filePath = undefined;
    loadedContexts = [];
    errorMessage = `Error while opening file dialog: ${String(e)}`;
  }
}

async function loadContextsFromFile(): Promise<void> {
  if (!filePath) {
    errorMessage = 'No file path selected';
    return;
  }

  loading = true;
  errorMessage = '';

  try {
    // Backend does all the parsing and conflict detection
    const importContexts = await contextsApi.getImportContexts(filePath);

    if (importContexts.length === 0) {
      errorMessage = 'No valid contexts found in the config file';
      loadedContexts = [];
      return;
    }

    // Add UI state to each context
    loadedContexts = importContexts.map(ctx => ({
      ...ctx,
      selected: true,
      conflictResolution: KEEP_BOTH,
    }));
  } catch (e) {
    errorMessage = `Failed to parse config file: ${String(e)}`;
    loadedContexts = [];
  } finally {
    loading = false;
  }
}

function updateConflictResolution(index: number, resolution: ConflictResolution): void {
  loadedContexts[index].conflictResolution = resolution;
}

async function importSelectedContexts(): Promise<void> {
  const selectedContexts = loadedContexts.filter(ctx => ctx.selected);

  if (selectedContexts.length === 0) {
    errorMessage = 'Please select at least one context to import';
    return;
  }

  if (!filePath) {
    errorMessage = 'Original kubeconfig file path not found';
    return;
  }

  loading = true;
  errorMessage = '';

  try {
    const conflictResolutions: Record<string, ConflictResolution> = {};
    selectedContexts.forEach(item => {
      if (item.hasConflict) {
        conflictResolutions[item.name] = item.conflictResolution;
      }
    });

    // Import using backend API
    await contextsApi.importContextsFromFile(
      filePath,
      selectedContexts.map(item => item.name),
      conflictResolutions,
    );

    // Close dialog on success
    closeCallback();
  } catch (err: unknown) {
    errorMessage = `Failed to import contexts: ${err}`;
  } finally {
    loading = false;
  }
}

function getSelectedCount(): number {
  return loadedContexts.filter(c => c.selected).length;
}
</script>

<Dialog title="Import Kubeconfig" onclose={closeCallback}>
  {#snippet content()}
    <div class="w-full space-y-4">
      {#if errorMessage}
        <ErrorMessage error={errorMessage} />
      {/if}

      <!-- File path input -->
      <label for="filePath" class="block mb-2 text-sm font-bold text-(--pd-modal-text)">File Path</label>
      <div class="flex flex-row grow space-x-1.5">
        <Input
          id="filePath"
          name="filePath"
          class="grow"
          bind:value={filePath}
          placeholder="Select a kubeconfig file..."
          readonly={true}
          required={true}
          clearable={false}
          aria-label="Kubeconfig file path"
          aria-invalid={errorMessage !== ''}>
        </Input>
        <Button aria-label="Browse for file" icon={faFolderOpen} on:click={openDialog} disabled={loading} />
      </div>

      {#if loading}
        <div class="flex items-center justify-center py-8">
          <span class="text-(--pd-modal-text)">Loading contexts...</span>
        </div>
      {/if}

      <!-- Contexts list -->
      {#if loadedContexts.length > 0 && !loading}
        <div class="text-sm text-(--pd-modal-text) mb-2">
          Found {loadedContexts.length} context{loadedContexts.length !== 1 ? 's' : ''} in the file:
        </div>

        {#each loadedContexts as item, index (item.name)}
          <ImportContextCard
            name={item.name}
            cluster={item.cluster}
            user={item.user}
            server={item.server}
            namespace={item.namespace}
            bind:selected={item.selected}
            hasConflict={item.hasConflict}
            conflictResolution={item.conflictResolution}
            onConflictResolutionChange={(resolution: ConflictResolution): void =>
              updateConflictResolution(index, resolution)} />
        {/each}
      {/if}
    </div>
  {/snippet}

  {#snippet buttons()}
    <Button type="link" onclick={closeCallback}>Cancel</Button>
    <Button
      disabled={getSelectedCount() === 0 || loading}
      icon={faFileImport}
      onclick={importSelectedContexts}
      inProgress={loading}
      aria-label="Import contexts">
      Import {getSelectedCount()} context{getSelectedCount() !== 1 ? 's' : ''}
    </Button>
  {/snippet}
</Dialog>
