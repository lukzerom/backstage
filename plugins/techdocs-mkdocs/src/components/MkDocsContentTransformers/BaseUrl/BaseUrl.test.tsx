/*
 * Copyright 2021 The Backstage Authors
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

// the import order matters, should be the first
import { createDom } from '../../../test-utils';

import React from 'react';
import { render, waitFor } from '@testing-library/react';

import {
  techdocsStorageApiRef,
  TechDocsShadowDomProvider,
} from '@backstage/plugin-techdocs';
import { wrapInTestApp, TestApiProvider } from '@backstage/test-utils';

import { BaseUrlTransformer } from './BaseUrl';

const navigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

const baseUrl = 'https://backstage.io/docs/backstage';
const getBaseUrl = jest.fn().mockResolvedValue(baseUrl);
const techdocsStorageApiMock = {
  getBaseUrl,
};

describe('BaseUrl', () => {
  const Transformer = () => null;
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Anchors', () => {
    it('Should replace relative path with the location origin', async () => {
      const dom = createDom(
        <body>
          <a href="/docs/backstage">Backstage</a>
        </body>,
      );

      render(
        wrapInTestApp(
          <TestApiProvider
            apis={[[techdocsStorageApiRef, techdocsStorageApiMock]]}
          >
            <TechDocsShadowDomProvider dom={dom}>
              <BaseUrlTransformer>
                <Transformer />
              </BaseUrlTransformer>
            </TechDocsShadowDomProvider>
          </TestApiProvider>,
        ),
      );

      await waitFor(() => {
        expect(dom.querySelector('a')?.getAttribute('href')).toBe(
          'http://localhost/docs/backstage',
        );
      });
    });

    it('Should replace relative path with the base URL', async () => {
      const dom = createDom(
        <body>
          <a href="/docs/backstage" download>
            Backstage
          </a>
        </body>,
      );

      render(
        wrapInTestApp(
          <TestApiProvider
            apis={[[techdocsStorageApiRef, techdocsStorageApiMock]]}
          >
            <TechDocsShadowDomProvider dom={dom}>
              <BaseUrlTransformer>
                <Transformer />
              </BaseUrlTransformer>
            </TechDocsShadowDomProvider>
          </TestApiProvider>,
        ),
      );

      await waitFor(() => {
        expect(dom.querySelector('a')?.getAttribute('href')).toBe(baseUrl);
      });
    });
  });
});
