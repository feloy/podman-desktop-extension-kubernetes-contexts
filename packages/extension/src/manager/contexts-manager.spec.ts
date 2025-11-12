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

import { expect, test, vi } from 'vitest';
import { ContextsManager } from '/@/manager/contexts-manager';
import { KubeConfig } from '@kubernetes/client-node';

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
