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

import { expect, test } from 'vitest';
import { render } from '@testing-library/svelte';
import ContextCardLine from '/@/component/ContextCardLine.svelte';

test('ContextCardLine should render', () => {
  const { queryByText, queryByLabelText } = render(ContextCardLine, {
    props: {
      title: 'Test Title',
      value: 'Test Value',
      label: 'Test Label',
    },
  });
  expect(queryByText('Test Title')).toBeInTheDocument();
  expect(queryByText('Test Value')).toBeInTheDocument();
  expect(queryByLabelText('Test Label')).toBeInTheDocument();
});
