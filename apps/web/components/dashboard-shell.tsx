import React from 'react';

import { ShellCard, StatPill } from '@erptry/ui';

import { LoginPanel } from './login-panel';

type DashboardShellProps = {
  apiBaseUrl: string;
  manifest: {
    headline: string;
    modules: string[];
    priorities: string[];
  };
};

export function DashboardShell({ apiBaseUrl, manifest }: DashboardShellProps) {
  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">ERP modular listo para crecer</p>
          <h1>ERPTRY nace con un nucleo claro para operar multiempresa desde el primer build.</h1>
          <p className="lede">{manifest.headline}</p>
        </div>
        <div className="hero-pills">
          <StatPill label="fase" value="bootstrap" />
          <StatPill label="canal" value="backoffice" />
          <StatPill label="modulos" value={String(manifest.modules.length)} />
        </div>
      </section>

      <section className="grid">
        <ShellCard eyebrow="Plataforma" title="Nucleo prioritario">
          <p>Los primeros modulos activos son autenticacion, usuarios, permisos, ajustes y multi-tenant.</p>
        </ShellCard>
        <ShellCard eyebrow="Operativa" title="Contratos listos para expandir">
          <p>El workspace ya comparte contratos, dominio y componentes para evitar divergencia entre API y web.</p>
        </ShellCard>
        <ShellCard eyebrow="Roadmap" title="Siguiente salto tecnico">
          <p>La siguiente iteracion entra en persistencia, sesiones, roles y bootstrap real del primer vertical.</p>
        </ShellCard>
      </section>

      <LoginPanel apiBaseUrl={apiBaseUrl} />

      <section className="modules-panel">
        <h2>Capacidades del bootstrap</h2>
        <div className="module-list">
          {manifest.modules.map((moduleName) => (
            <span key={moduleName} className="module-pill">
              {moduleName}
            </span>
          ))}
        </div>
      </section>

      <section className="modules-panel modules-panel--soft">
        <h2>Prioridades activas</h2>
        <div className="module-list">
          {manifest.priorities.map((priority) => (
            <span key={priority} className="module-pill module-pill--accent">
              {priority}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
