import { describe, expect, it, vi } from 'vitest';

import { getTenantSettings } from './settings-service.js';

describe('getTenantSettings', () => {
  it('devuelve defaults cuando no hay configuracion persistida', async () => {
    const prisma = {
      tenantSetting: {
        findUnique: vi.fn().mockResolvedValue(null)
      }
    };

    const settings = await getTenantSettings(prisma as never, 'tenant_1');

    expect(settings.brandingName).toBe('ERPTRY Demo');
  });
});
