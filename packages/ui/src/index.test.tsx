import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ShellCard } from './index';

describe('ShellCard', () => {
  it('renderiza el titulo recibido', () => {
    const html = renderToStaticMarkup(<ShellCard title="Control">Contenido</ShellCard>);

    expect(html).toContain('Control');
  });
});
