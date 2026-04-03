import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomePage from './page';

describe('HomePage', () => {
  it('renderiza el titular principal', async () => {
    const page = await HomePage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain('ERPTRY nace con un nucleo claro');
  });
});
