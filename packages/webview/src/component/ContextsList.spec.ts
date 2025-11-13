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

import '@testing-library/jest-dom/vitest';

import { beforeEach, expect, test, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { StatesMocks } from '/@/tests/state-mocks';
import type { AvailableContextsInfo } from '@kubernetes-contexts/channels';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import ContextCard from '/@/component/ContextCard.svelte';
import ContextsList from '/@/component/ContextsList.svelte';
import { kubernetesIconBase64 } from '/@/component/KubeIcon';

vi.mock(import('/@/component/ContextCard.svelte'));

const statesMocks = new StatesMocks();
let availableContextsMock: FakeStateObject<AvailableContextsInfo, void>;

beforeEach(() => {
  vi.resetAllMocks();
  statesMocks.reset();
  availableContextsMock = new FakeStateObject();
  statesMocks.mock<AvailableContextsInfo, void>('stateAvailableContextsInfoUI', availableContextsMock);
});

test('ContextCardLine should not render cards when no available contexts', () => {
  render(ContextsList);
  expect(availableContextsMock.subscribe).toHaveBeenCalled();
  expect(ContextCard).not.toHaveBeenCalled();
});

test('ContextCardLine should render cards when available contexts', () => {
  availableContextsMock.setData({
    clusters: [
      {
        name: 'test-cluster-1',
        server: 'https://test-cluster-1.com',
        skipTLSVerify: false,
      },
      {
        name: 'test-cluster-2',
        server: 'https://test-cluster-2.com',
        skipTLSVerify: false,
      },
    ],
    users: [
      {
        name: 'test-user-1',
      },
      {
        name: 'test-user-2',
      },
    ],
    contexts: [
      {
        name: 'test-context-1',
        namespace: 'test-namespace-1',
        cluster: 'test-cluster-1',
        user: 'test-user-1',
      },
      {
        name: 'test-context-2',
        cluster: 'test-cluster-2',
        user: 'test-user-2',
      },
    ],
    currentContext: 'test-context-1',
  });
  render(ContextsList);
  expect(availableContextsMock.subscribe).toHaveBeenCalled();
  expect(ContextCard).toHaveBeenCalledTimes(2);
  expect(ContextCard).toHaveBeenCalledWith(expect.anything(), {
    cluster: {
      name: 'test-cluster-1',
      server: 'https://test-cluster-1.com',
      skipTLSVerify: false,
    },
    user: {
      name: 'test-user-1',
    },
    name: 'test-context-1',
    namespace: 'test-namespace-1',
    currentContext: true,
    icon: kubernetesIconBase64,
  });
  expect(ContextCard).toHaveBeenCalledWith(expect.anything(), {
    cluster: {
      name: 'test-cluster-2',
      server: 'https://test-cluster-2.com',
      skipTLSVerify: false,
    },
    user: {
      name: 'test-user-2',
    },
    name: 'test-context-2',
    namespace: undefined,
    currentContext: false,
    icon: kubernetesIconBase64,
  });
});
