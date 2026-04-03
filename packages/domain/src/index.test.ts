import { describe, expect, it } from 'vitest';

import { createPlatformSnapshot, findBootstrapUserByEmail, roleCanManageSettings } from './index';

describe('domain bootstrap', () => {
  it('genera una instantanea valida del nucleo', () => {
    const snapshot = createPlatformSnapshot();

    expect(snapshot.tenant.slug).toBe('erptry');
    expect(snapshot.capabilities).toContain('auth');
  });

  it('limita la gestion de ajustes a roles altos', () => {
    expect(roleCanManageSettings('owner')).toBe(true);
    expect(roleCanManageSettings('viewer')).toBe(false);
  });

  it('permite localizar un usuario demo por email', () => {
    const user = findBootstrapUserByEmail('owner@erptry.local');

    expect(user?.id).toBe('user_owner');
  });
});
