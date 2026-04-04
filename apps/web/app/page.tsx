import React from 'react';

import { getApiManifest, webConfig } from '../lib/api';
import { DashboardShell } from '../components/dashboard-shell';

export default async function HomePage() {
  const manifest = await getApiManifest();

  return <DashboardShell apiBaseUrl={webConfig.browserApiBaseUrl} manifest={manifest} />;
}
