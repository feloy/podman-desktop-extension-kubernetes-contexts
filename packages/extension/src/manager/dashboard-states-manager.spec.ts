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

import { afterEach, assert, beforeEach, describe, expect, test, vi } from 'vitest';
import { DashboardStatesManager } from './dashboard-states-manager';
import { type Disposable, type Extension, extensions } from '@podman-desktop/api';
import {
  type ContextsHealthsInfo,
  type KubernetesDashboardExtensionApi,
  type KubernetesDashboardSubscriber,
} from '@podman-desktop/kubernetes-dashboard-extension-api';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('dashboard extension is not installed', () => {
  let manager: DashboardStatesManager;
  const onDidChangeDisposable: () => void = vi.fn();

  beforeEach(() => {
    vi.mocked(extensions.onDidChange).mockReturnValue({
      dispose: onDidChangeDisposable,
    } as unknown as Disposable);
  });

  afterEach(() => {
    manager?.dispose();
  });

  test('subscriber is undefined', () => {
    manager = new DashboardStatesManager();
    manager.init();
    expect(manager.getSubscriber()).toBeUndefined();
  });

  test('onDidChangeDisposable is called', () => {
    manager = new DashboardStatesManager();
    manager.init();
    manager.dispose();
    expect(onDidChangeDisposable).toHaveBeenCalled();
  });
});

describe('dashboard extension is installed', () => {
  let manager: DashboardStatesManager;
  const onDidChangeDisposable: () => void = vi.fn();
  const subscriber: () => KubernetesDashboardSubscriber = vi.fn();
  const disposeSubscriber: () => void = vi.fn();
  const onContextsHealth: (callback: (healthInfo: ContextsHealthsInfo) => void) => void = vi.fn();

  beforeEach(() => {
    vi.mocked(extensions.onDidChange).mockImplementation(f => {
      setTimeout(() => {
        f();
      }, 0);
      return {
        dispose: onDidChangeDisposable,
      } as unknown as Disposable;
    });
    vi.mocked(extensions.getExtension).mockImplementation(id => {
      vi.mocked(subscriber).mockReturnValue({
        onContextsHealth: onContextsHealth,
        onContextsPermissions: vi.fn(),
        onResourcesCount: vi.fn(),
        dispose: disposeSubscriber,
      } as unknown as KubernetesDashboardSubscriber);
      if (id === 'redhat.kubernetes-dashboard') {
        return {
          exports: {
            getSubscriber: subscriber,
          },
        } as unknown as Extension<KubernetesDashboardExtensionApi>;
      }
      return undefined;
    });
  });

  afterEach(() => {
    manager?.dispose();
  });

  test('subscriber is eventually defined', async () => {
    manager = new DashboardStatesManager();
    manager.init();
    await vi.waitFor(() => {
      expect(manager.getSubscriber()).toBeDefined();
    });
  });

  test('onContextsHealth is eventually called on subscriber', async () => {
    manager = new DashboardStatesManager();
    manager.init();
    await vi.waitFor(() => {
      expect(onContextsHealth).toHaveBeenCalled();
    });
  });

  test('when contextsHealth callback is called, onContextsHealthChange is fired', async () => {
    manager = new DashboardStatesManager();
    const onContextsHealthChangeCallback: () => void = vi.fn();
    manager.onContextsHealthChange(onContextsHealthChangeCallback);

    manager.init();

    await vi.waitFor(() => {
      expect(onContextsHealth).toHaveBeenCalled();
    });
    const cb = vi.mocked(onContextsHealth).mock.calls[0][0];
    assert(cb);
    expect(onContextsHealthChangeCallback).not.toHaveBeenCalled();
    cb!({
      healths: [
        {
          contextName: 'context1',
          checking: false,
          reachable: true,
          offline: false,
        },
      ],
    });
    expect(onContextsHealthChangeCallback).toHaveBeenCalled();
  });

  test('when contextsHealth callback is called, getContextsHealths returns the correct value', async () => {
    manager = new DashboardStatesManager();
    const onContextsHealthChangeCallback: () => void = vi.fn();
    manager.onContextsHealthChange(onContextsHealthChangeCallback);

    manager.init();

    await vi.waitFor(() => {
      expect(onContextsHealth).toHaveBeenCalled();
    });
    const cb = vi.mocked(onContextsHealth).mock.calls[0][0];
    assert(cb);
    expect(onContextsHealthChangeCallback).not.toHaveBeenCalled();
    const newContextsHealths: ContextsHealthsInfo = {
      healths: [
        {
          contextName: 'context1',
          checking: false,
          reachable: true,
          offline: false,
        },
      ],
    };
    cb!(newContextsHealths);
    expect(manager.getContextsHealths()).toEqual(newContextsHealths);
  });

  test('onDidChangeDisposable is called', () => {
    manager = new DashboardStatesManager();
    manager.init();
    manager.dispose();
    expect(onDidChangeDisposable).toHaveBeenCalled();
  });

  test('subscriber is disposed on dispose', async () => {
    manager = new DashboardStatesManager();
    manager.init();
    await vi.waitFor(() => {
      expect(manager.getSubscriber()).toBeDefined();
    });
    manager.dispose();
    expect(disposeSubscriber).toHaveBeenCalled();
  });
});
