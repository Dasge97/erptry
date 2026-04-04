import { createPlatformSnapshot } from '@erptry/domain';

const fallbackSnapshot = createPlatformSnapshot();

const browserApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const serverApiBaseUrl = process.env.INTERNAL_API_BASE_URL ?? browserApiBaseUrl;

export const webConfig = {
  browserApiBaseUrl,
  serverApiBaseUrl
};

export async function getApiManifest() {
  try {
    const response = await fetch(`${webConfig.serverApiBaseUrl}/api/manifest`, {
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
      headline: 'Backoffice operable para pymes de servicios con circuito cliente -> servicio -> venta -> factura -> cobro -> operacion interna.',
      modules: [...fallbackSnapshot.capabilities, 'clients', 'products-services', 'sales', 'billing-invoicing', 'payments', 'employees', 'tasks-internal-work', 'reservations-scheduling', 'analytics', 'notifications', 'logs-audit'],
      priorities: ['tenant demo operable', 'circuito comercial-financiero', 'trabajo interno y agenda', 'control y trazabilidad', 'repaso visual de cierre vendible']
    };
  }
}
