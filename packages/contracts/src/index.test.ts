import { describe, expect, it } from 'vitest';

import { platformSnapshotSchema } from './index';

describe('platformSnapshotSchema', () => {
  it('acepta una instantanea valida', () => {
    const parsed = platformSnapshotSchema.parse({
      tenant: {
        id: 'tenant_erptry',
        slug: 'erptry',
        name: 'ERPTRY Demo',
        plan: 'growth'
      },
      users: [
        {
          id: 'user_owner',
          email: 'owner@erptry.local',
          fullName: 'Owner Demo',
          role: 'owner',
          tenantId: 'tenant_erptry'
        }
      ],
      capabilities: ['auth', 'multi-tenant'],
      phase: 'bootstrap'
    });

    expect(parsed.tenant.slug).toBe('erptry');
  });
});
