/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
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

import type { RpcExtension } from '@kubernetes-contexts/rpc';
import { beforeEach, expect, test, vi } from 'vitest';
import { AvailableContextsDispatcher } from '/@/dispatcher/available-contexts-dispatcher';
import type { ContextsManager } from '/@/manager/contexts-manager';
import type { Cluster, Context, KubeConfig, User } from '@kubernetes/client-node';

let rpcExtension: RpcExtension;
let contextsManager: ContextsManager;

beforeEach(() => {
  rpcExtension = {
    fire: vi.fn(),
  } as unknown as RpcExtension;
  contextsManager = {
    getKubeConfig: vi.fn(),
  } as unknown as ContextsManager;
});

test('getData should return the available contexts', () => {
  vi.mocked(contextsManager.getKubeConfig).mockReturnValue({
    getClusters: vi.fn(),
    getUsers: vi.fn(),
    getContexts: vi.fn(),
    getCurrentContext: vi.fn(),
  } as unknown as KubeConfig);
  vi.mocked(contextsManager.getKubeConfig().getClusters).mockReturnValue([
    {
      name: 'cluster1',
      server: 'https://cluster1.example.com',
    },
  ] as Cluster[]);
  vi.mocked(contextsManager.getKubeConfig().getUsers).mockReturnValue([
    {
      name: 'user1',
    },
  ] as User[]);
  vi.mocked(contextsManager.getKubeConfig().getContexts).mockReturnValue([
    {
      name: 'context1',
    },
  ] as Context[]);
  vi.mocked(contextsManager.getKubeConfig().getCurrentContext).mockReturnValue('context1');
  const dispatcher = new AvailableContextsDispatcher(rpcExtension, contextsManager);
  const data = dispatcher.getData();
  expect(data).toBeDefined();
  expect(data.clusters).toEqual([
    {
      name: 'cluster1',
      server: 'https://cluster1.example.com',
    },
  ]);
  expect(data.users).toEqual([
    {
      name: 'user1',
    },
  ]);
  expect(data.contexts).toEqual([
    {
      name: 'context1',
    },
  ]);
  expect(data.currentContext).toEqual('context1');
});
