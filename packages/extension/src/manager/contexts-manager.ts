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

import { ContextsApi } from '@kubernetes-contexts/channels';
import { injectable } from 'inversify';
import { Emitter, Event } from '/@/types/emitter';
import { KubeConfig } from '@kubernetes/client-node';
import { kubernetes, window } from '@podman-desktop/api';
import { writeFile } from 'node:fs/promises';
import * as jsYaml from 'js-yaml';

@injectable()
export class ContextsManager implements ContextsApi {
  #onContextsChange = new Emitter<void>();
  onContextsChange: Event<void> = this.#onContextsChange.event;

  #currentKubeConfig: KubeConfig;

  constructor() {
    // start with an empty kubeconfig
    this.#currentKubeConfig = new KubeConfig();
  }

  async update(kubeConfig: KubeConfig): Promise<void> {
    this.#currentKubeConfig = kubeConfig;
    this.#onContextsChange.fire();
  }

  getKubeConfig(): KubeConfig {
    return this.#currentKubeConfig;
  }

  async setCurrentContext(contextName: string): Promise<void> {
    try {
      this.#currentKubeConfig.setCurrentContext(contextName);
      await this.saveKubeConfig();
      this.#onContextsChange.fire();
    } catch (error: unknown) {
      window.showNotification({
        title: 'Error setting current context',
        body: `Setting current context to "${contextName}" failed: ${String(error)}`,
        type: 'error',
        highlight: true,
      });
    }
  }

  async deleteContext(contextName: string): Promise<void> {
    if (contextName === this.#currentKubeConfig.getCurrentContext()) {
      const result = await window.showInformationMessage(
        `You will delete the current context. If you delete it, you will need to switch to another context. Continue?`,
        'Yes',
        'Cancel',
      );
      if (result !== 'Yes') {
        return;
      }
    }
    await this.deleteContextInternal(contextName);
  }

  findNewContextName(kubeConfig: KubeConfig, contextName: string): string {
    let counter = 1;
    let newName = `${contextName}-${counter}`;
    // Keep creating new name by adding 1 to name until not existing name is found
    while (kubeConfig.contexts.find(context => context.name === newName)) {
      counter += 1;
      newName = `${contextName}-${counter}`;
    }
    return newName;
  }

  async duplicateContext(contextName: string): Promise<void> {
    try {
      const newConfig = new KubeConfig();
      const kubeConfig = this.getKubeConfig();
      const newName = this.findNewContextName(kubeConfig, contextName);
      const originalContext = kubeConfig.contexts.find(context => context.name === contextName);
      if (!originalContext) return;

      newConfig.loadFromOptions({
        clusters: kubeConfig.clusters,
        users: kubeConfig.users,
        currentContext: kubeConfig.currentContext,
        contexts: [
          ...kubeConfig.contexts,
          {
            ...originalContext,
            name: newName,
          },
        ],
      });

      await this.update(newConfig);
      await this.saveKubeConfig();
    } catch (error: unknown) {
      window.showNotification({
        title: 'Error duplicating context',
        body: `Duplicating context "${contextName}" failed: ${String(error)}`,
        type: 'error',
        highlight: true,
      });
    }
  }

  async deleteContextInternal(contextName: string): Promise<void> {
    try {
      this.#currentKubeConfig = this.removeContext(this.#currentKubeConfig, contextName);
      await this.saveKubeConfig();
      this.#onContextsChange.fire();
    } catch (error: unknown) {
      window.showNotification({
        title: 'Error deleting context',
        body: `Deleting context "${contextName}" failed: ${String(error)}`,
        type: 'error',
        highlight: true,
      });
    }
  }

  async saveKubeConfig(): Promise<void> {
    const jsonString = this.#currentKubeConfig.exportConfig();
    const yamlString = jsYaml.dump(JSON.parse(jsonString));
    const kubeconfigUri = kubernetes.getKubeconfig();
    await writeFile(kubeconfigUri.path, yamlString);
  }

  removeContext(kubeconfig: KubeConfig, contextName: string): KubeConfig {
    const previousContexts = kubeconfig.contexts;
    const previousCurrentContextName = kubeconfig.getCurrentContext();
    const newContexts = previousContexts.filter(ctx => ctx.name !== contextName);
    if (newContexts.length === previousContexts.length) {
      return kubeconfig;
    }
    let newCurrentContextName: string | undefined = previousCurrentContextName;
    if (previousCurrentContextName === contextName) {
      newCurrentContextName = undefined;
    }

    const newConfig = new KubeConfig();
    newConfig.loadFromOptions({
      contexts: newContexts,
      clusters: kubeconfig.clusters.filter(cluster => {
        // remove clusters not referenced anymore, except if there were already not referenced before
        return (
          newContexts.some(ctx => ctx.cluster === cluster.name) ||
          !previousContexts.some(ctx => ctx.cluster === cluster.name)
        );
      }),
      users: kubeconfig.users.filter(user => {
        // remove users not referenced anymore, except if there were already not referenced before
        return newContexts.some(ctx => ctx.user === user.name) || !previousContexts.some(ctx => ctx.user === user.name);
      }),
      currentContext: newCurrentContextName ?? '',
    });
    return newConfig;
  }
}
