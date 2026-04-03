import { createPlatformSnapshot } from '@erptry/domain';

const fallbackSnapshot = createPlatformSnapshot();

export const webConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3001'
};

export async function getApiManifest() {
  try {
    const response = await fetch(`${webConfig.apiBaseUrl}/api/manifest`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('manifest_unavailable');
    }

    return response.json() as Promise<{
      name: 'ERPTRY';
      headline: string;
      modules: string[];
      priorities: string[];
    }>;
  } catch {
    return {
      name: 'ERPTRY',
      headline: 'ERP modular para operaciones, ventas y gestion multiempresa.',
      modules: [...fallbackSnapshot.capabilities],
      priorities: ['bootstrap tecnico', 'nucleo de plataforma', 'circuito comercial']
    };
  }
}
