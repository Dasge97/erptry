import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomePage from './page';

describe('HomePage', () => {
  it('renderiza el titular principal', async () => {
    const page = await HomePage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain('ERPTRY prepara un backoffice vendible');
    expect(html).toContain('Perfiles demo listos para repaso');
    expect(html).toContain('Owner demo');
    expect(html).toContain('viewer@erptry.local');
  });
});
