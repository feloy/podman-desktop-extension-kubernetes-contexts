/**********************************************************************
 * Copyright (C) 2025 - 2026 Red Hat, Inc.
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

import { Disposable, extensions } from '@podman-desktop/api';
import {
  ContextsHealthsInfo,
  ResourcesCountInfo,
  KubernetesDashboardSubscriber,
  ContextsPermissionsInfo,
} from '@podman-desktop/kubernetes-dashboard-extension-api';
import { inject, injectable } from 'inversify';
import { Emitter, Event } from '/@/types/emitter';
import { DashboardApiManager } from '/@/manager/dashboard-api-manager';

@injectable()
export class DashboardStatesManager implements Disposable {
  #onContextsHealthChange = new Emitter<void>();
  onContextsHealthChange: Event<void> = this.#onContextsHealthChange.event;

  #onResourcesCountChange = new Emitter<void>();
  onResourcesCountChange: Event<void> = this.#onResourcesCountChange.event;

  #onContextsPermissionsChange = new Emitter<void>();
  onContextsPermissionsChange: Event<void> = this.#onContextsPermissionsChange.event;

  #subscriptions: Disposable[] = [];
  #subscriber: KubernetesDashboardSubscriber | undefined;

  #contextsHealths: ContextsHealthsInfo = { healths: [] };
  #resourcesCount: ResourcesCountInfo = { counts: [] };
  #contextsPermissions: ContextsPermissionsInfo = { permissions: [] };

  @inject(DashboardApiManager)
  protected dashboardApiManager: DashboardApiManager;

  init(): void {
    const didChangeSubscription = extensions.onDidChange(() => {
      const api = this.dashboardApiManager.getApi();
      if (api) {
        this.#subscriber = api.getSubscriber();
        // dispose the subscriber when the extension is deactivated
        this.#subscriptions.push(this.#subscriber);
        // stop being notified when the extension is changed
        didChangeSubscription.dispose();

        // We always store the contexts healths, resources permissions and count locally as the information is very small
        // and we don't want to store it only when there are some subscribers
        this.#subscriber.onContextsHealth(event => {
          this.#contextsHealths = event;
          this.#onContextsHealthChange.fire();
        });
        this.#subscriber.onResourcesCount(event => {
          this.#resourcesCount = event;
          this.#onResourcesCountChange.fire();
        });
        this.#subscriber.onContextsPermissions(event => {
          this.#contextsPermissions = event;
          this.#onContextsPermissionsChange.fire();
        });
      }
    });
    // stop being notified when the extension is deactivated
    this.#subscriptions.push(didChangeSubscription);
  }

  dispose(): void {
    for (const subscription of this.#subscriptions) {
      subscription.dispose();
    }
    this.#subscriptions = [];
  }

  getSubscriber(): KubernetesDashboardSubscriber | undefined {
    return this.#subscriber;
  }

  getContextsHealths(): ContextsHealthsInfo {
    return this.#contextsHealths;
  }

  getResourcesCount(): ResourcesCountInfo {
    return this.#resourcesCount;
  }

  getContextsPermissions(): ContextsPermissionsInfo {
    return this.#contextsPermissions;
  }
}
