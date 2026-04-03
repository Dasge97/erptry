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
          <p className="eyebrow">Release operable v1 en endurecimiento</p>
          <h1>ERPTRY prepara un backoffice vendible para pymes de servicios, no solo una demo tecnica.</h1>
          <p className="lede">{manifest.headline}</p>
        </div>
        <div className="hero-pills">
          <StatPill label="release" value="operable-v1" />
          <StatPill label="canal" value="servicios" />
          <StatPill label="modulos" value={String(manifest.modules.length)} />
        </div>
      </section>

      <section className="grid">
        <ShellCard eyebrow="Circuito vendible" title="Del cliente al cobro">
          <p>La release ya cubre clientes, catalogo, ventas, facturacion y cobros con datos persistidos y tenant demo repetible.</p>
        </ShellCard>
        <ShellCard eyebrow="Operacion interna" title="Trabajo con trazabilidad">
          <p>Empleados, tareas, reservas, notificaciones y auditoria conectan la ejecucion interna con el contexto comercial real.</p>
        </ShellCard>
        <ShellCard eyebrow="Cierre de release" title="Ultimo repaso visual">
          <p>El siguiente filtro es revisar copy, formularios en EUR y control operativo en navegador antes de plantear cierre vendible.</p>
        </ShellCard>
      </section>

      <LoginPanel apiBaseUrl={apiBaseUrl} />

      <section className="modules-panel">
        <h2>Perimetro operativo activo</h2>
        <div className="module-list">
          {manifest.modules.map((moduleName) => (
            <span key={moduleName} className="module-pill">
              {moduleName}
            </span>
          ))}
        </div>
      </section>

      <section className="modules-panel modules-panel--soft">
        <h2>Prioridades del cierre vendible</h2>
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
