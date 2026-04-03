import type { PrismaClient } from '@prisma/client';

import { tenantSettingsSchema } from '@erptry/contracts';

const SETTINGS_KEY = 'core';

const defaultSettings = {
  brandingName: 'ERPTRY Demo',
  defaultLocale: 'es-ES',
  timezone: 'Europe/Madrid'
};

export async function getTenantSettings(prisma: PrismaClient, tenantId: string) {
  const record = await prisma.tenantSetting.findUnique({
    where: {
      tenantId_key: {
        tenantId,
        key: SETTINGS_KEY
      }
    }
  });

  return tenantSettingsSchema.parse(record?.value ?? defaultSettings);
}

export async function upsertTenantSettings(
  prisma: PrismaClient,
  tenantId: string,
  settings: {
    brandingName: string;
    defaultLocale: string;
    timezone: string;
  }
) {
  const parsed = tenantSettingsSchema.parse(settings);

  await prisma.tenantSetting.upsert({
    where: {
      tenantId_key: {
        tenantId,
        key: SETTINGS_KEY
      }
    },
    update: {
      value: parsed
    },
    create: {
      tenantId,
      key: SETTINGS_KEY,
      value: parsed
    }
  });

  return parsed;
}
