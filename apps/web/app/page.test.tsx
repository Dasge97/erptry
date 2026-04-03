import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomePage from './page';

describe('HomePage', () => {
  it('renderiza el titular principal', () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('ERPTRY nace con un nucleo claro');
  });
});
