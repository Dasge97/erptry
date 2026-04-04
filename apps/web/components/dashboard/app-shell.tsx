'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { DashboardProvider, useDashboard } from './dashboard-context';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/clients', label: 'Clientes' },
  { href: '/dashboard/catalog', label: 'Catalogo' },
  { href: '/dashboard/sales', label: 'Ventas' },
  { href: '/dashboard/invoices', label: 'Facturas' },
  { href: '/dashboard/payments', label: 'Cobros' },
  { href: '/dashboard/employees', label: 'Empleados' },
  { href: '/dashboard/tasks', label: 'Tareas' },
  { href: '/dashboard/reservations', label: 'Reservas' },
  { href: '/dashboard/users', label: 'Usuarios' },
  { href: '/dashboard/roles', label: 'Roles' },
  { href: '/dashboard/settings', label: 'Settings' }
];

const upcomingItems = ['Notificaciones', 'Auditoria', 'Reportes', 'Analytics'];

function DashboardChrome({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { errorMessage, manifest, overview, session, signOut, status } = useDashboard();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeSectionLabel = useMemo(() => {
    const item = navigationItems.find((entry) => entry.href === pathname);
    return item?.label ?? 'Dashboard';
  }, [pathname]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [router, status]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (status === 'loading') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="mb-0 text-body-secondary">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary p-4">
        <div className="alert alert-danger shadow-sm mb-0" role="alert">
          <h1 className="h4">No se pudo abrir el dashboard</h1>
          <p className="mb-3">{errorMessage}</p>
          <a className="btn btn-outline-danger" href="/login">Volver al login</a>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || !session || !overview) {
    return null;
  }

  return (
    <div className="min-vh-100 bg-body-tertiary">
        <div className="container-fluid">
        <div className="row flex-nowrap">
          <aside className={`col-12 col-lg-3 col-xl-2 erp-sidebar bg-white border-end px-0 ${menuOpen ? 'erp-sidebar--open' : ''}`}>
            <div className="p-3 p-lg-4 sticky-top erp-sidebar__inner">
              <div className="mb-4">
                <span className="badge text-bg-primary mb-2">ERPTRY</span>
                <h1 className="h4 mb-1">{overview.tenant.name}</h1>
                <p className="small text-body-secondary mb-0">{session.actor.fullName} · {session.actor.role}</p>
              </div>

              <nav className="nav nav-pills flex-column gap-2 mb-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    className={`nav-link text-start ${pathname === item.href ? 'active' : 'link-body-emphasis'}`}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="card border-0 bg-body-tertiary mb-3">
                <div className="card-body py-3">
                  <h2 className="h6 text-uppercase text-body-secondary">Siguientes modulos</h2>
                  <div className="d-flex flex-wrap gap-2">
                    {upcomingItems.map((item) => (
                      <span key={item} className="badge rounded-pill text-bg-light border">{item}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button className="btn btn-outline-secondary w-100" type="button" onClick={() => void signOut()}>
                Cerrar sesion
              </button>
            </div>
          </aside>

          {menuOpen ? <button className="erp-sidebar-backdrop d-lg-none" type="button" aria-label="Cerrar menu" onClick={() => setMenuOpen(false)} /> : null}

          <div className="col px-0">
            <header className="border-bottom bg-white">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 px-4 py-3">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2 d-lg-none">
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setMenuOpen(true)}>
                      Menu
                    </button>
                    <span className="badge text-bg-light border">{activeSectionLabel}</span>
                  </div>
                  <p className="text-uppercase text-body-secondary small mb-1">Dashboard modular</p>
                  <h2 className="h4 mb-0">{activeSectionLabel}</h2>
                  <p className="text-body-secondary mb-0 mt-1">{manifest?.headline ?? 'Backoffice modular para servicios.'}</p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge text-bg-light border">Plan {overview.tenant.plan}</span>
                  <span className="badge text-bg-light border">Usuarios {overview.totalUsers}</span>
                  <span className="badge text-bg-light border">Sesiones {overview.activeSessions}</span>
                </div>
              </div>
            </header>

            <main className="p-3 p-lg-4">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardAppShell({ children }: React.PropsWithChildren) {
  return (
    <DashboardProvider>
      <DashboardChrome>{children}</DashboardChrome>
    </DashboardProvider>
  );
}
