'use client';

import React from 'react';
import { useMemo, useState } from 'react';

type LoginPanelProps = {
  apiBaseUrl: string;
};

type LoginState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'success';
      actor: string;
      permissions: string[];
      tenantName: string;
      totalUsers: number;
      activeSessions: number;
    };

export function LoginPanel({ apiBaseUrl }: LoginPanelProps) {
  const [email, setEmail] = useState('owner@erptry.local');
  const [password, setPassword] = useState('erptry1234');
  const [state, setState] = useState<LoginState>({ status: 'idle' });

  const helperText = useMemo(() => {
    if (state.status === 'error') return state.message;
    if (state.status === 'success') return `Sesion activa para ${state.actor}`;

    return 'Cuando la API tenga PostgreSQL y seed ejecutado, este panel entrara con auth persistida.';
  }, [state]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: 'loading' });

    try {
      const loginResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const loginPayload = await loginResponse.json();

      if (!loginResponse.ok) {
        setState({ status: 'error', message: loginPayload.message ?? 'No se pudo iniciar sesion.' });
        return;
      }

      const meResponse = await fetch(`${apiBaseUrl}/api/auth/me`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ token: loginPayload.token })
      });

      const mePayload = await meResponse.json();

      if (!meResponse.ok) {
        setState({ status: 'error', message: mePayload.message ?? 'No se pudo resolver la sesion.' });
        return;
      }

      const tenantResponse = await fetch(`${apiBaseUrl}/api/platform/tenant/current`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ token: loginPayload.token })
      });

      const tenantPayload = await tenantResponse.json();

      if (!tenantResponse.ok) {
        setState({ status: 'error', message: tenantPayload.message ?? 'No se pudo consultar el tenant.' });
        return;
      }

      setState({
        status: 'success',
        actor: mePayload.actor.fullName,
        permissions: mePayload.permissions,
        tenantName: tenantPayload.tenant.name,
        totalUsers: tenantPayload.totalUsers,
        activeSessions: tenantPayload.activeSessions
      });
    } catch {
      setState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  return (
    <section className="login-panel">
      <div>
        <p className="eyebrow">Acceso persistido</p>
        <h2>Primer circuito real de autenticacion</h2>
        <p className="login-copy">La API ya expone login persistido preparado para PostgreSQL, roles y permisos.</p>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
        </label>
        <label>
          <span>Contrasena</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
        </label>
        <button type="submit" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Conectando...' : 'Probar acceso'}
        </button>
      </form>
      <p className={`login-status login-status--${state.status}`}>{helperText}</p>
      {state.status === 'success' ? (
        <>
          <div className="login-metrics">
            <span className="module-pill">tenant: {state.tenantName}</span>
            <span className="module-pill">usuarios: {state.totalUsers}</span>
            <span className="module-pill">sesiones activas: {state.activeSessions}</span>
          </div>
          <div className="permission-list">
            {state.permissions.map((permission) => (
              <span key={permission} className="module-pill">
                {permission}
              </span>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
