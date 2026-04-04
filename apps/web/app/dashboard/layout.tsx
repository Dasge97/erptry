import type { PropsWithChildren } from 'react';

import { DashboardAppShell } from '../../components/dashboard/app-shell';

export default function DashboardLayout({ children }: PropsWithChildren) {
  return <DashboardAppShell>{children}</DashboardAppShell>;
}
