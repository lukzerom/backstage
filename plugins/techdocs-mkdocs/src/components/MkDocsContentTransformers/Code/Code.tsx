/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';

import { Portal } from '@material-ui/core';

import { useTechDocsShadowDom } from '@backstage/plugin-techdocs';
import CopyIcon from './CopyIcon';

const CODE_SELECTOR = 'pre > code';

export const CodeTransformer = () => {
  const dom = useTechDocsShadowDom();

  if (!dom) return null;

  const codes = dom.querySelectorAll(CODE_SELECTOR);

  if (!codes.length) return null;

  return (
    <>
      {Array.from(codes).map((code, index) => {
        const container = document.createElement('div');
        code.parentElement?.prepend(container);
        return (
          <Portal key={index} container={container}>
            <button
              className="md-clipboard md-icon"
              title="Copy to clipboard"
              onClick={() => {
                navigator.clipboard.writeText(code.textContent || '');
              }}
            >
              <CopyIcon />
            </button>
          </Portal>
        );
      })}
    </>
  );
};
