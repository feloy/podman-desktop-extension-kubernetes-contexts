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

import { inject, injectable } from 'inversify';
import type { OpenDialogApi } from '@kubernetes-contexts/channels';
import { OPEN_DIALOG_RESULTS } from '@kubernetes-contexts/channels';
import * as podmanDesktopApi from '@podman-desktop/api';
import type { OpenDialogOptions } from '@podman-desktop/api';
import { RpcExtension } from '@kubernetes-contexts/rpc';

@injectable()
export class OpenDialogApiImpl implements OpenDialogApi {
  constructor(@inject(RpcExtension) private rpcExtension: RpcExtension) {}

  async openDialog(id: string, options: OpenDialogOptions): Promise<void> {
    // Fire-and-forget: don't await the dialog, return immediately
    // The result will be broadcast via OPEN_DIALOG_RESULTS channel
    podmanDesktopApi.window.showOpenDialog(options).then(
      uris => {
        // Extract paths as strings (Uri objects don't serialize properly through RPC)
        const files = uris?.map(uri => uri.fsPath);
        this.rpcExtension.fire(OPEN_DIALOG_RESULTS, { id, files }).catch((error: unknown) => {
          console.error(`Error sending open dialog result: ${String(error)}`);
          podmanDesktopApi.window.showNotification({
            title: 'Error sending open dialog result',
            body: `Sending open dialog result failed: ${String(error)}`,
            type: 'error',
            highlight: true,
          });
        });
      },
      (error: unknown) => {
        console.error(`Error opening dialog: ${error}`);
        podmanDesktopApi.window.showNotification({
          title: 'Error opening dialog',
          body: `Opening dialog failed: ${String(error)}`,
          type: 'error',
          highlight: true,
        });
        this.rpcExtension.fire(OPEN_DIALOG_RESULTS, { id, files: undefined }).catch(console.error);
      },
    );
  }
}
