'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { webConfig } from '../../lib/api';
import { getSessionToken, login, setSessionToken } from '../../lib/erptry-client';

const demoUsers = [
  { role: 'Owner', email: 'owner@erptry.local' },
  { role: 'Manager', email: 'manager@erptry.local' },
  { role: 'Operator', email: 'operator@erptry.local' },
  { role: 'Viewer', email: 'viewer@erptry.local' }
];

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@erptry.local');
  const [password, setPassword] = useState('erptry1234');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (getSessionToken()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const helperText = useMemo(() => {
    if (status === 'loading') {
      return 'Validando acceso...';
    }

    if (status === 'error') {
      return errorMessage;
    }

    return 'Usa cualquier perfil demo con la clave erptry1234.';
  }, [errorMessage, status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const token = await login(webConfig.browserApiBaseUrl, email, password);
      setSessionToken(token);
      router.push('/dashboard');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion.');
    }
  }

  return (
    <main className="min-vh-100 d-flex align-items-center py-5 erp-auth-bg">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 col-xl-9">
            <div className="card shadow-lg border-0 overflow-hidden erp-auth-card">
              <div className="row g-0">
                <div className="col-lg-5 text-bg-dark p-4 p-lg-5 erp-auth-panel">
                  <span className="badge rounded-pill text-bg-light text-uppercase mb-3">ERPTRY</span>
                  <h1 className="display-6 fw-semibold mb-3">Login clasico para entrar al ERP.</h1>
                  <p className="mb-4 text-white-50">
                    El acceso queda separado del dashboard para poder trabajar cada modulo desde su propia vista.
                  </p>
                  <div className="d-grid gap-2">
                    {demoUsers.map((user) => (
                      <button
                        key={user.email}
                        type="button"
                        className="btn btn-outline-light text-start"
                        onClick={() => {
                          setEmail(user.email);
                          setPassword('erptry1234');
                        }}
                      >
                        <span className="fw-semibold d-block">{user.role}</span>
                        <span className="small opacity-75">{user.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-lg-7 p-4 p-lg-5 bg-white">
                  <div className="mb-4">
                    <h2 className="h3 mb-2">Acceso</h2>
                    <p className="text-body-secondary mb-0">Entra y te llevamos a un dashboard modular con menu lateral y vistas separadas.</p>
                  </div>
                  <form className="d-grid gap-3" onSubmit={handleSubmit}>
                    <div>
                      <label className="form-label" htmlFor="email">Email</label>
                      <input
                        id="email"
                        className="form-control form-control-lg"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="password">Contrasena</label>
                      <input
                        id="password"
                        className="form-control form-control-lg"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>
                    <button className="btn btn-primary btn-lg" type="submit" disabled={status === 'loading'}>
                      {status === 'loading' ? 'Entrando...' : 'Iniciar sesion'}
                    </button>
                  </form>
                  <div className={`alert mt-4 mb-0 ${status === 'error' ? 'alert-danger' : 'alert-secondary'}`} role="alert">
                    {helperText}
                  </div>
                  <div className="row row-cols-1 row-cols-md-2 g-3 mt-1">
                    <div className="col">
                      <div className="border rounded-4 p-3 h-100 bg-body-tertiary">
                        <div className="small text-uppercase text-body-secondary mb-2">Acceso</div>
                        <strong className="d-block mb-1">Login aislado</strong>
                        <span className="small text-body-secondary">Sin mezclar operacion ni modulos dentro de la pantalla de entrada.</span>
                      </div>
                    </div>
                    <div className="col">
                      <div className="border rounded-4 p-3 h-100 bg-body-tertiary">
                        <div className="small text-uppercase text-body-secondary mb-2">Destino</div>
                        <strong className="d-block mb-1">Dashboard por modulos</strong>
                        <span className="small text-body-secondary">Clientes, ventas, facturas, cobros, empleados, tareas y reservas por separado.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
