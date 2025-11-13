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

import { beforeEach, expect, test, vi } from 'vitest';
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
