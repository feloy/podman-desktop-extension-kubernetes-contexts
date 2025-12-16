/**********************************************************************
 * Copyright (C) 2024 Red Hat, Inc.
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

import { ContextsManager } from './contexts-manager.js';
import { RpcChannel } from '@kubernetes-contexts/rpc';
import { inject, injectable, multiInject } from 'inversify';
import { DispatcherObject } from '/@/dispatcher/util/dispatcher-object.js';
import { ChannelSubscriber } from '/@/manager/channel-subscriber.js';
import { AVAILABLE_CONTEXTS, CONTEXT_HEALTHS } from '@kubernetes-contexts/channels';
import { DashboardStatesManager } from '/@/manager/dashboard-states-manager.js';

@injectable()
export class Dispatcher {
  @inject(ContextsManager)
  private manager: ContextsManager;

  @inject(DashboardStatesManager)
  private dashboardStatesManager: DashboardStatesManager;

  #dispatchers: Map<string, DispatcherObject<unknown>> = new Map();
  #channelSubscriber: ChannelSubscriber;

  constructor(
    @multiInject(DispatcherObject) dispatchers: DispatcherObject<unknown>[],
    @inject(ChannelSubscriber) channelSubscriber: ChannelSubscriber,
  ) {
    this.#channelSubscriber = channelSubscriber;
    dispatchers.forEach(dispatcher => {
      this.#dispatchers.set(dispatcher.channelName, dispatcher);
    });
  }

  init(): void {
    this.manager.onContextsChange(async () => {
      await this.dispatch(AVAILABLE_CONTEXTS);
    });
    this.dashboardStatesManager.onContextsHealthChange(async () => {
      await this.dispatch(CONTEXT_HEALTHS);
    });

    this.#channelSubscriber.onSubscribe(async channelName => await this.dispatchByChannelName(channelName));
  }

  // TODO replace this with an event
  async dispatch(channel: RpcChannel<unknown>): Promise<void> {
    return this.dispatchByChannelName(channel.name);
  }

  async dispatchByChannelName(channelName: string): Promise<void> {
    if (!this.#channelSubscriber.hasSubscribers(channelName)) {
      return;
    }
    const subscriptions = this.#channelSubscriber.getSubscriptions(channelName);

    const dispatcher = this.#dispatchers.get(channelName);
    if (!dispatcher) {
      console.error(`dispatcher not found for channel ${channelName}`);
      return;
    }
    await dispatcher.dispatch(subscriptions);
  }
}
