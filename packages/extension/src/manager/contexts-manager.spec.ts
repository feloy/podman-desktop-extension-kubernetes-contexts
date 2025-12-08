/**********************************************************************
 * Copyright (C) 2024 - 2025 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ContextsManager } from '/@/manager/contexts-manager';
import { KubeConfig } from '@kubernetes/client-node';
import { kubernetes, type Uri, window } from '@podman-desktop/api';
import { vol } from 'memfs';

beforeEach(() => {
  vi.resetAllMocks();
  vol.reset();
});

vi.mock(import('node:fs/promises'));

test('default KubeConfig should be empty', () => {
  const contextsManager = new ContextsManager();
  expect(contextsManager.getKubeConfig()).toEqual(new KubeConfig());
});

test('update should set the KubeConfig', async () => {
  const contextsManager = new ContextsManager();
  const kubeConfig = new KubeConfig();
  kubeConfig.loadFromString(`
    clusters:
      - name: cluster1
        cluster:
          server: https://cluster1.example.com
    users:
      - name: user1
    contexts:
      - name: context1
        context:
          cluster: cluster1
          user: user1
  `);
  await contextsManager.update(kubeConfig);
  expect(contextsManager.getKubeConfig()).toEqual(kubeConfig);
});

test('update triggers onContextsChange', async () => {
  const contextsManager = new ContextsManager();
  const kubeConfig = new KubeConfig();
  kubeConfig.loadFromString(`
    clusters:
      - name: cluster1
        cluster:
          server: https://cluster1.example.com
    users:
      - name: user1
    contexts:
      - name: context1
        context:
          cluster: cluster1
          user: user1
  `);
  const onContextsChangeCallback: () => void = vi.fn();
  contextsManager.onContextsChange(onContextsChangeCallback);
  expect(onContextsChangeCallback).not.toHaveBeenCalled();
  await contextsManager.update(kubeConfig);
  expect(onContextsChangeCallback).toHaveBeenCalledOnce();
  expect(onContextsChangeCallback).toHaveBeenCalledWith(undefined);
});

test('setCurrentContext should show error notification if it fails', async () => {
  const contextsManager = new ContextsManager();
  const kubeConfig = new KubeConfig();
  kubeConfig.loadFromString(`
    clusters:
      - name: cluster1
        cluster:
          server: https://cluster1.example.com
  `);
  vi.mocked(kubernetes.getKubeconfig).mockImplementation(() => {
    throw new Error('error getting kubeconfig path');
  });
  await contextsManager.setCurrentContext('context2');
  expect(window.showNotification).toHaveBeenCalledWith({
    title: 'Error setting current context',
    body: 'Setting current context to "context2" failed: Error: error getting kubeconfig path',
    type: 'error',
    highlight: true,
  });
});

test('setCurrentContext rewrites file with new current context', async () => {
  const kubeConfigPath = '/path/to/kube/config';
  vol.fromJSON({
    [kubeConfigPath]: '{}',
  });
  vi.mocked(kubernetes.getKubeconfig).mockReturnValue({
    path: kubeConfigPath,
  } as Uri);
  const contextsManager = new ContextsManager();
  const kubeConfig = new KubeConfig();
  const kubeconfigFileContent = `{
      clusters: [
        {
          name: 'cluster1',
          cluster: {
            server: 'https://cluster1.example.com',
          },
        },
      ],
      users: [
        {
          name: 'user1',
        },
      ],
      contexts: [
        {
          name: 'context1',
          context: {
            cluster: 'cluster1',
            user: 'user1',
          },
        },
      ],
    }`;
  kubeConfig.loadFromString(kubeconfigFileContent);
  await contextsManager.update(kubeConfig);

  await contextsManager.setCurrentContext('context1');

  const fsScreenshot = vol.toJSON();
  const kubeconfigFile = fsScreenshot['/path/to/kube/config'];
  const kubeconfigFileNew = new KubeConfig();
  kubeconfigFileNew.loadFromString(kubeconfigFile ?? '');
  expect(kubeconfigFileNew.getCurrentContext()).toEqual('context1');
});

describe('removeContext', () => {
  test('the context and its references are removed from the KubeConfig', () => {
    const contextsManager = new ContextsManager();
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromString(`
      contexts:
        - name: context1
          context:
            cluster: cluster1
            user: user1
        - name: context2
          context:
            cluster: cluster2
            user: user2
      current-context: context1
      clusters:
        - name: cluster1
          cluster:
            server: https://cluster1.example.com
        - name: cluster2
          cluster:
            server: https://cluster2.example.com
      users:
        - name: user1
        - name: user2
    `);
    const newKubeConfig = contextsManager.removeContext(kubeConfig, 'context1');
    expect(newKubeConfig.getContexts()).toEqual([
      {
        name: 'context2',
        cluster: 'cluster2',
        user: 'user2',
      },
    ]);
    expect(newKubeConfig.getClusters()).toEqual([
      {
        name: 'cluster2',
        server: 'https://cluster2.example.com',
        skipTLSVerify: false,
      },
    ]);
    expect(newKubeConfig.getUsers().length).toEqual(1);
    expect(newKubeConfig.getUsers()[0].name).toEqual('user2');
    expect(newKubeConfig.getCurrentContext()).toEqual('');
  });

  test('the current context is not changed if it is not the context to remove', () => {
    const contextsManager = new ContextsManager();
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromString(`
      contexts:
        - name: context1
          context:
            cluster: cluster1
            user: user1
        - name: context2
          context:
            cluster: cluster2
            user: user2
      current-context: context2
      clusters:
        - name: cluster1
          cluster:
            server: https://cluster1.example.com
        - name: cluster2
          cluster:
            server: https://cluster2.example.com
      users:
        - name: user1
        - name: user2
    `);
    const newKubeConfig = contextsManager.removeContext(kubeConfig, 'context1');
    expect(newKubeConfig.getContexts()).toEqual([
      {
        name: 'context2',
        cluster: 'cluster2',
        user: 'user2',
      },
    ]);
    expect(newKubeConfig.getClusters()).toEqual([
      {
        name: 'cluster2',
        server: 'https://cluster2.example.com',
        skipTLSVerify: false,
      },
    ]);
    expect(newKubeConfig.getUsers().length).toEqual(1);
    expect(newKubeConfig.getUsers()[0].name).toEqual('user2');
    expect(newKubeConfig.getCurrentContext()).toEqual('context2');
  });

  test('unrelated references are not removed from the KubeConfig', () => {
    const contextsManager = new ContextsManager();
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromString(`
      contexts:
        - name: context1
          context:
            cluster: cluster1
            user: user1
        - name: context2
          context:
            cluster: cluster2
            user: user2        
      current-context: context1
      clusters:
        - name: cluster1
          cluster:
            server: https://cluster1.example.com
        - name: cluster2
          cluster:
            server: https://cluster2.example.com
        - name: cluster3
          cluster:
            server: https://cluster3.example.com
      users:
        - name: user1
        - name: user2
        - name: user3
    `);
    const newKubeConfig = contextsManager.removeContext(kubeConfig, 'context1');
    expect(newKubeConfig.getContexts()).toEqual([
      {
        name: 'context2',
        cluster: 'cluster2',
        user: 'user2',
      },
    ]);
    expect(newKubeConfig.getClusters()).toEqual([
      {
        name: 'cluster2',
        server: 'https://cluster2.example.com',
        skipTLSVerify: false,
      },
      {
        name: 'cluster3',
        server: 'https://cluster3.example.com',
        skipTLSVerify: false,
      },
    ]);
    expect(newKubeConfig.getUsers().length).toEqual(2);
    expect(newKubeConfig.getUsers()[0].name).toEqual('user2');
    expect(newKubeConfig.getUsers()[1].name).toEqual('user3');
  });

  test('same KubeConfig is returned if context to remove is not found', () => {
    const contextsManager = new ContextsManager();
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromString(`
      contexts:
        - name: context1
          context:
            cluster: cluster1
            user: user1
      current-context: context1
      clusters:
        - name: cluster1
          cluster:
            server: https://cluster1.example.com
      users:
        - name: user1
    `);
    const newKubeConfig = contextsManager.removeContext(kubeConfig, 'context2');
    expect(newKubeConfig.getContexts()).toEqual([
      {
        name: 'context1',
        cluster: 'cluster1',
        user: 'user1',
      },
    ]);
    expect(newKubeConfig.getClusters()).toEqual([
      {
        name: 'cluster1',
        server: 'https://cluster1.example.com',
        skipTLSVerify: false,
      },
    ]);
    expect(newKubeConfig.getUsers().length).toEqual(1);
    expect(newKubeConfig.getUsers()[0].name).toEqual('user1');
  });
});

test('deleteContext should show error notification if it fails', async () => {
  const contextsManager = new ContextsManager();
  const kubeConfig = new KubeConfig();
  kubeConfig.loadFromString(`
    clusters:
      - name: cluster1
        cluster:
          server: https://cluster1.example.com
  `);
  vi.mocked(kubernetes.getKubeconfig).mockImplementation(() => {
    throw new Error('error getting kubeconfig path');
  });
  await contextsManager.deleteContext('context1');
  expect(window.showNotification).toHaveBeenCalledWith({
    title: 'Error deleting context',
    body: 'Deleting context "context1" failed: Error: error getting kubeconfig path',
    type: 'error',
    highlight: true,
  });
});

test('deleteContext rewrites file with new current context, no confirmation needed for non current context', async () => {
  const kubeConfigPath = '/path/to/kube/config';
  vol.fromJSON({
    [kubeConfigPath]: '{}',
  });
  vi.mocked(kubernetes.getKubeconfig).mockReturnValue({
    path: kubeConfigPath,
  } as Uri);
  const contextsManager = new ContextsManager();
  const kubeConfig = new KubeConfig();
  const kubeconfigFileContent = `{
      clusters: [
        {
          name: 'cluster1',
          cluster: {
            server: 'https://cluster1.example.com',
          },
        },
        {
          name: 'cluster2',
          cluster: {
            server: 'https://cluster2.example.com',
          },
        },
        {
          name: 'cluster3',
          cluster: {
            server: 'https://cluster3.example.com',
          },
        },
      ],
      users: [
        {
          name: 'user1',
        },
        {
          name: 'user2',
        },
        {
          name: 'user3',
        },
      ],
      contexts: [
        {
          name: 'context1',
          context: {
            cluster: 'cluster1',
            user: 'user1',
          },
        },
        {
          name: 'context2',
          context: {
            cluster: 'cluster2',
            user: 'user2',
          },
        },
        {
          name: 'context3',
          context: {
            cluster: 'cluster3',
            user: 'user3',
          },
        },
      ],
    }`;
  kubeConfig.loadFromString(kubeconfigFileContent);
  await contextsManager.update(kubeConfig);

  await contextsManager.deleteContext('context1');

  const fsScreenshot = vol.toJSON();
  const kubeconfigFile = fsScreenshot['/path/to/kube/config'];
  const kubeconfigFileNew = new KubeConfig();
  kubeconfigFileNew.loadFromString(kubeconfigFile ?? '');
  expect(kubeconfigFileNew.getContexts()).toHaveLength(2);
  expect(window.showInformationMessage).not.toHaveBeenCalled();
});

test('deleteContext the current context asks for confirmation', async () => {
  const kubeConfigPath = '/path/to/kube/config';
  vol.fromJSON({
    [kubeConfigPath]: '{}',
  });
  vi.mocked(kubernetes.getKubeconfig).mockReturnValue({
    path: kubeConfigPath,
  } as Uri);
  const contextsManager = new ContextsManager();
  const kubeConfig = new KubeConfig();
  const kubeconfigFileContent = `{
    clusters: [
      {
        name: 'cluster1',
        cluster: {
          server: 'https://cluster1.example.com',
        },
      },
      {
        name: 'cluster2',
        cluster: {
          server: 'https://cluster2.example.com',
        },
      },
      {
        name: 'cluster3',
        cluster: {
          server: 'https://cluster3.example.com',
        },
      },
    ],
    users: [
      {
        name: 'user1',
      },
      {
        name: 'user2',
      },
      {
        name: 'user3',
      },
    ],
    contexts: [
      {
        name: 'context1',
        context: {
          cluster: 'cluster1',
          user: 'user1',
        },
      },
      {
        name: 'context2',
        context: {
          cluster: 'cluster2',
          user: 'user2',
        },
      },
      {
        name: 'context3',
        context: {
          cluster: 'cluster3',
          user: 'user3',
        },
      },
    ],
    "current-context": "context1"
  }`;
  kubeConfig.loadFromString(kubeconfigFileContent);
  await contextsManager.update(kubeConfig);

  expect(contextsManager.getKubeConfig().getContexts()).toHaveLength(3);

  vi.mocked(window.showInformationMessage).mockResolvedValue('Yes');

  await contextsManager.deleteContext('context1');

  const fsScreenshot = vol.toJSON();
  const kubeconfigFile = fsScreenshot['/path/to/kube/config'];
  const kubeconfigFileNew = new KubeConfig();
  kubeconfigFileNew.loadFromString(kubeconfigFile ?? '');
  expect(kubeconfigFileNew.getContexts()).toHaveLength(2);
  expect(window.showInformationMessage).toHaveBeenCalled();
});

test('deleteContext the current context asks for confirmation, and do nothing if refused', async () => {
  const kubeConfigPath = '/path/to/kube/config';
  vol.fromJSON({
    [kubeConfigPath]: '{}',
  });
  vi.mocked(kubernetes.getKubeconfig).mockReturnValue({
    path: kubeConfigPath,
  } as Uri);
  const contextsManager = new ContextsManager();
  const kubeConfig = new KubeConfig();
  const kubeconfigFileContent = `{
    clusters: [
      {
        name: 'cluster1',
        cluster: {
          server: 'https://cluster1.example.com',
        },
      },
      {
        name: 'cluster2',
        cluster: {
          server: 'https://cluster2.example.com',
        },
      },
      {
        name: 'cluster3',
        cluster: {
          server: 'https://cluster3.example.com',
        },
      },
    ],
    users: [
      {
        name: 'user1',
      },
      {
        name: 'user2',
      },
      {
        name: 'user3',
      },
    ],
    contexts: [
      {
        name: 'context1',
        context: {
          cluster: 'cluster1',
          user: 'user1',
        },
      },
      {
        name: 'context2',
        context: {
          cluster: 'cluster2',
          user: 'user2',
        },
      },
      {
        name: 'context3',
        context: {
          cluster: 'cluster3',
          user: 'user3',
        },
      },
    ],
    "current-context": "context1"
  }`;
  kubeConfig.loadFromString(kubeconfigFileContent);
  await contextsManager.update(kubeConfig);

  expect(contextsManager.getKubeConfig().getContexts()).toHaveLength(3);

  vi.mocked(window.showInformationMessage).mockResolvedValue('Cancel');

  await contextsManager.deleteContext('context1');

  const fsScreenshot = vol.toJSON();
  const kubeconfigFile = fsScreenshot['/path/to/kube/config'];
  expect(kubeconfigFile).toEqual('{}');
});

test('should duplicate context from config', async () => {
  const kubeConfigPath = '/path/to/kube/config';
  vol.fromJSON({
    [kubeConfigPath]: '{}',
  });
  vi.mocked(kubernetes.getKubeconfig).mockReturnValue({
    path: kubeConfigPath,
  } as Uri);
  const contextsManager = new ContextsManager();
  const kubeConfig = new KubeConfig();
  const kubeconfigFileContent = `{
    clusters: [
      {
        name: 'cluster1',
        cluster: {
          server: 'https://cluster1.example.com',
        },
      },
    ],
    users: [
      {
        name: 'user1',
      },
    ],
    contexts: [
      {
        name: 'context1',
        context: {
          cluster: 'cluster1',
          user: 'user1',
        },
      },
    ],
    "current-context": "context1"
  }`;
  kubeConfig.loadFromString(kubeconfigFileContent);
  await contextsManager.update(kubeConfig);

  expect(contextsManager.getKubeConfig().getContexts()).toHaveLength(1);

  await contextsManager.duplicateContext(kubeConfig.contexts[0].name);
  let contexts = contextsManager.getKubeConfig().getContexts();
  expect(contexts.length).toBe(2);

  expect(contexts[1].name).toBe('context1-1');

  await contextsManager.duplicateContext(kubeConfig.contexts[0].name);
  contexts = contextsManager.getKubeConfig().getContexts();
  expect(contexts.length).toBe(3);
  expect(contexts[2].name).toBe('context1-2');
});
