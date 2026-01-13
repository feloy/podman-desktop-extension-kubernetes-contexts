/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import '@testing-library/jest-dom/vitest';

import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ImportModal from './ImportModal.svelte';
import { RemoteMocks } from '/@/tests/remote-mocks';
import { RpcBrowserMocks } from '/@/tests/rpc-browser-mocks';
import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import type {
  AvailableContextsInfo,
  ContextsApi,
  ImportContextInfo,
  OpenDialogApi,
} from '@kubernetes-contexts/channels';
import { API_CONTEXTS, API_OPEN_DIALOG, OPEN_DIALOG_RESULTS } from '@kubernetes-contexts/channels';

const remoteMocks = new RemoteMocks();
const rpcBrowserMocks = new RpcBrowserMocks();
const statesMocks = new StatesMocks();
let availableContextsMock: FakeStateObject<AvailableContextsInfo, void>;

const mockCloseCallback: () => void = vi.fn();

// Mock import contexts data (returned by getImportContexts)
const mockImportContexts: ImportContextInfo[] = [
  {
    name: 'new-context',
    cluster: 'new-cluster',
    user: 'new-user',
    namespace: 'production',
    server: 'https://new-cluster:6443',
    hasConflict: false,
  },
  {
    name: 'existing-context',
    cluster: 'existing-cluster',
    user: 'existing-user',
    namespace: 'default',
    server: 'https://existing-cluster:6443',
    hasConflict: true,
  },
];

// Mock functions
const openDialogApiMock: OpenDialogApi = {
  openDialog: vi.fn(),
} as unknown as OpenDialogApi;

const contextsApiMock: ContextsApi = {
  getImportContexts: vi.fn(),
  importContextsFromFile: vi.fn(),
} as unknown as ContextsApi;

beforeEach(() => {
  vi.resetAllMocks();

  remoteMocks.reset();
  rpcBrowserMocks.reset();
  statesMocks.reset();

  // Mock States
  availableContextsMock = new FakeStateObject();
  statesMocks.mock<AvailableContextsInfo, void>('stateAvailableContextsInfoUI', availableContextsMock);
  availableContextsMock.setData({
    clusters: [{ name: 'existing-cluster', server: 'https://existing-cluster:6443', skipTLSVerify: false }],
    users: [{ name: 'existing-user' }],
    contexts: [{ name: 'existing-context', cluster: 'existing-cluster', user: 'existing-user', namespace: 'default' }],
    currentContext: 'existing-context',
  });

  // Mock Remote APIs
  remoteMocks.mock(API_OPEN_DIALOG, openDialogApiMock);
  remoteMocks.mock(API_CONTEXTS, contextsApiMock);

  // Default mock for getImportContexts
  vi.mocked(contextsApiMock.getImportContexts).mockResolvedValue(mockImportContexts);
  vi.mocked(contextsApiMock.importContextsFromFile).mockResolvedValue(undefined);
});

/** Helper to simulate file selection via broadcast and wait for contexts to load */
async function selectFileAndWaitForContexts(): Promise<void> {
  const browseButton = screen.getByLabelText('Browse for file');
  await userEvent.click(browseButton);

  // Simulate the broadcast result
  rpcBrowserMocks.fire(OPEN_DIALOG_RESULTS, { id: 'import-modal', files: ['/path/to/kubeconfig.yaml'] });

  await waitFor(() => {
    expect(screen.getByText('Found 2 contexts in the file:')).toBeInTheDocument();
  });
}

describe('ImportModal', () => {
  test('renders dialog with title and browse button', async () => {
    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    expect(screen.getByText('Import Kubeconfig')).toBeInTheDocument();
    expect(screen.getByLabelText('Browse for file')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select a kubeconfig file...')).toBeInTheDocument();
  });

  test('import button is disabled when no file selected', async () => {
    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    const importButton = screen.getByRole('button', { name: 'Import contexts' });
    expect(importButton).toBeInTheDocument();
    expect(importButton).toBeDisabled();
  });

  test('cancel button calls closeCallback', async () => {
    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);

    expect(mockCloseCallback).toHaveBeenCalled();
  });

  test('opens file dialog when browse button clicked', async () => {
    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    const browseButton = screen.getByLabelText('Browse for file');
    await userEvent.click(browseButton);

    expect(openDialogApiMock.openDialog).toHaveBeenCalledWith('import-modal', {
      title: 'Select Kubernetes config file to import',
      selectors: ['openFile'],
      filters: [{ name: 'All files', extensions: ['*'] }],
    });
  });

  test('calls getImportContexts after file selection', async () => {
    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    const browseButton = screen.getByLabelText('Browse for file');
    await userEvent.click(browseButton);

    // Simulate broadcast result
    rpcBrowserMocks.fire(OPEN_DIALOG_RESULTS, { id: 'import-modal', files: ['/path/to/kubeconfig.yaml'] });

    await waitFor(() => {
      expect(contextsApiMock.getImportContexts).toHaveBeenCalledWith('/path/to/kubeconfig.yaml');
    });
  });

  test('displays loaded contexts after file selection', async () => {
    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    await selectFileAndWaitForContexts();

    expect(screen.getByRole('row', { name: 'new-context' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: 'existing-context' })).toBeInTheDocument();
  });

  test('shows import button with correct count', async () => {
    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    await selectFileAndWaitForContexts();

    // Button has aria-label="Import contexts" but text content shows count
    const importButton = screen.getByRole('button', { name: 'Import contexts' });
    expect(importButton).toBeInTheDocument();
    expect(importButton).not.toBeDisabled();
    expect(importButton).toHaveTextContent('Import 2 contexts');
  });

  test('shows conflict warning for existing context', async () => {
    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    await selectFileAndWaitForContexts();

    expect(screen.getByText('⚠ A context with this name already exists')).toBeInTheDocument();
  });

  test('shows error when no contexts found in file', async () => {
    vi.mocked(contextsApiMock.getImportContexts).mockResolvedValue([]);

    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    const browseButton = screen.getByLabelText('Browse for file');
    await userEvent.click(browseButton);

    rpcBrowserMocks.fire(OPEN_DIALOG_RESULTS, { id: 'import-modal', files: ['/path/to/kubeconfig.yaml'] });

    await waitFor(() => {
      expect(screen.getByText('No valid contexts found in the config file')).toBeInTheDocument();
    });
  });

  test('shows error when parsing fails', async () => {
    vi.mocked(contextsApiMock.getImportContexts).mockRejectedValue(new Error('Parse error'));

    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    const browseButton = screen.getByLabelText('Browse for file');
    await userEvent.click(browseButton);

    rpcBrowserMocks.fire(OPEN_DIALOG_RESULTS, { id: 'import-modal', files: ['/path/to/kubeconfig.yaml'] });

    await waitFor(() => {
      expect(screen.getByText(/Failed to parse config file/)).toBeInTheDocument();
    });
  });

  test('calls importContextsFromFile when import clicked', async () => {
    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    await selectFileAndWaitForContexts();

    const importButton = screen.getByRole('button', { name: 'Import contexts' });
    await userEvent.click(importButton);

    await waitFor(() => {
      expect(contextsApiMock.importContextsFromFile).toHaveBeenCalledWith(
        '/path/to/kubeconfig.yaml',
        ['new-context', 'existing-context'],
        expect.objectContaining({ 'existing-context': 'keep-both' }),
      );
    });
  });

  test('closes dialog on successful import', async () => {
    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    await selectFileAndWaitForContexts();

    const importButton = screen.getByRole('button', { name: 'Import contexts' });
    await userEvent.click(importButton);

    await waitFor(() => {
      expect(mockCloseCallback).toHaveBeenCalled();
    });
  });

  test('shows error when import fails', async () => {
    vi.mocked(contextsApiMock.importContextsFromFile).mockRejectedValue(new Error('Import failed'));

    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    await selectFileAndWaitForContexts();

    const importButton = screen.getByRole('button', { name: 'Import contexts' });
    await userEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to import contexts/)).toBeInTheDocument();
    });
  });

  test('displays context details (cluster, server, user)', async () => {
    render(ImportModal, {
      props: { closeCallback: mockCloseCallback },
    });

    await selectFileAndWaitForContexts();

    // Check that both contexts show their cluster details
    const clusters = screen.getAllByLabelText('Context Cluster');
    expect(clusters).toHaveLength(2);
    expect(clusters.map(el => el.textContent)).toContain('new-cluster');
    expect(clusters.map(el => el.textContent)).toContain('existing-cluster');

    // Check servers
    const servers = screen.getAllByLabelText('Context Server');
    expect(servers).toHaveLength(2);

    // Check users
    const users = screen.getAllByLabelText('Context User');
    expect(users).toHaveLength(2);
  });
});
