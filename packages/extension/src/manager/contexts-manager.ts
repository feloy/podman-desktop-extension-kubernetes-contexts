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

  async setCurrentContext(_contextName: string): Promise<void> {
    throw new Error('setCurrentContext Method not implemented.');
  }
}
