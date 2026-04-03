import React from 'react';

import { createPlatformSnapshot } from '@erptry/domain';
import { ShellCard, StatPill } from '@erptry/ui';

const snapshot = createPlatformSnapshot();

export function DashboardShell() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">ERP modular listo para crecer</p>
          <h1>ERPTRY nace con un nucleo claro para operar multiempresa desde el primer build.</h1>
          <p className="lede">
            Esta base prioriza identidad, permisos, tenant scope y una expansion por dominios que no comprometa la mantenibilidad.
          </p>
        </div>
        <div className="hero-pills">
          <StatPill label="fase" value="bootstrap" />
          <StatPill label="tenant" value={snapshot.tenant.slug} />
          <StatPill label="modulos" value={String(snapshot.capabilities.length)} />
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

      <section className="modules-panel">
        <h2>Capacidades del bootstrap</h2>
        <div className="module-list">
          {snapshot.capabilities.map((moduleName) => (
            <span key={moduleName} className="module-pill">
              {moduleName}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
