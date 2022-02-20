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

import { useEffect } from 'react';

import {
  techdocsStorageApiRef,
  useTechDocsReader,
  useTechDocsShadowDom,
} from '@backstage/plugin-techdocs';
import { useApi } from '@backstage/core-plugin-api';

/**
 * TechDocs backend serves SVGs with text/plain content-type for security. This
 * helper determines if an SVG is being loaded from the backend, and thus needs
 * inlining to be displayed properly.
 */
const isInlineSvg = (src: string, apiOrigin: string) => {
  const isSrcToSvg = src.endsWith('.svg');
  const isRelativeUrl = !src.match(/^([a-z]*:)?\/\//i);
  const pointsToOurBackend = src.startsWith(apiOrigin);
  return isSrcToSvg && (isRelativeUrl || pointsToOurBackend);
};

const getSvgText = (url: string) => {
  return fetch(url, { credentials: 'include' }).then(res => res.text());
};

export const ImageTransformer = () => {
  const dom = useTechDocsShadowDom();
  const { path, entityName } = useTechDocsReader();
  const techdocsStorageApi = useApi(techdocsStorageApiRef);

  useEffect(() => {
    if (!dom) return;

    const images = dom.getElementsByTagName('img');

    if (!images.length) return;

    for (const image of images) {
      const src = image.getAttribute('src');

      if (!src) continue;

      techdocsStorageApi.getBaseUrl(src, entityName, path).then(baseUrl => {
        // Special handling for SVG images.
        if (isInlineSvg(src, baseUrl)) {
          getSvgText(baseUrl)
            .then(text => {
              image.setAttribute(
                'src',
                `data:image/svg+xml;base64,${btoa(text)}`,
              );
            })
            .catch(() => {
              image.setAttribute('alt', `Error: ${src}`);
            });
        }
      });
    }
  }, [dom, path, entityName, techdocsStorageApi]);

  return null;
};
