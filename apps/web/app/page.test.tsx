import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import HomePage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  })
}));

describe('HomePage', () => {
  it('renderiza el login clasico', async () => {
    const page = await HomePage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain('Login clasico para entrar al ERP');
    expect(html).toContain('Iniciar sesion');
    expect(html).toContain('viewer@erptry.local');
  });
});
