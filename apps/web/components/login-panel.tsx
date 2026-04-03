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
      token: string;
      settings: {
        brandingName: string;
        defaultLocale: string;
        timezone: string;
      };
      rolesCatalog: Array<{
        id: string;
        code: string;
        name: string;
        permissions: string[];
      }>;
      users: Array<{
        id: string;
        fullName: string;
        email: string;
        status: string;
        roles: string[];
      }>;
      clients: Array<{
        id: string;
        fullName: string;
        email: string | null;
        phone: string | null;
        segment: string;
        notes: string | null;
      }>;
    };

type CreateUserState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string };

type SaveSettingsState = CreateUserState;

export function LoginPanel({ apiBaseUrl }: LoginPanelProps) {
  const [email, setEmail] = useState('owner@erptry.local');
  const [password, setPassword] = useState('erptry1234');
  const [state, setState] = useState<LoginState>({ status: 'idle' });
  const [newUserName, setNewUserName] = useState('Operaciones Demo');
  const [newUserEmail, setNewUserEmail] = useState('ops@erptry.local');
  const [newUserPassword, setNewUserPassword] = useState('erptry1234');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'operator' | 'viewer'>('manager');
  const [createUserState, setCreateUserState] = useState<CreateUserState>({ status: 'idle' });
  const [saveSettingsState, setSaveSettingsState] = useState<SaveSettingsState>({ status: 'idle' });
  const [brandingName, setBrandingName] = useState('ERPTRY Demo');
  const [defaultLocale, setDefaultLocale] = useState('es-ES');
  const [timezone, setTimezone] = useState('Europe/Madrid');
  const [clientName, setClientName] = useState('Cliente Demo');
  const [clientEmail, setClientEmail] = useState('cliente@demo.test');
  const [clientPhone, setClientPhone] = useState('600222333');
  const [clientSegment, setClientSegment] = useState('general');
  const [clientNotes, setClientNotes] = useState('Alta desde el backoffice.');

  async function loadRoles(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/platform/roles`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar los roles.');
    }

    return payload as Array<{
      id: string;
      code: string;
      name: string;
      permissions: string[];
    }>;
  }

  async function loadClients(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/clients/list`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar los clientes.');
    }

    return payload as Array<{
      id: string;
      fullName: string;
      email: string | null;
      phone: string | null;
      segment: string;
      notes: string | null;
    }>;
  }

  const helperText = useMemo(() => {
    if (state.status === 'error') return state.message;
    if (state.status === 'success') return `Sesion activa para ${state.actor}`;

    return 'Cuando la API tenga PostgreSQL y seed ejecutado, este panel entrara con auth persistida.';
  }, [state]);

  async function loadUsers(token: string) {
    const usersResponse = await fetch(`${apiBaseUrl}/api/platform/users`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const usersPayload = await usersResponse.json();

    if (!usersResponse.ok) {
      throw new Error(usersPayload.message ?? 'No se pudieron cargar los usuarios.');
    }

    return usersPayload as Array<{
      id: string;
      fullName: string;
      email: string;
      status: string;
      roles: string[];
    }>;
  }

  async function loadSettings(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/platform/settings`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar los ajustes.');
    }

    return payload as {
      brandingName: string;
      defaultLocale: string;
      timezone: string;
    };
  }

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

      const users = await loadUsers(loginPayload.token);
      const settings = await loadSettings(loginPayload.token);
      const rolesCatalog = await loadRoles(loginPayload.token);
      const clients = await loadClients(loginPayload.token);

      setBrandingName(settings.brandingName);
      setDefaultLocale(settings.defaultLocale);
      setTimezone(settings.timezone);

      setState({
        status: 'success',
        actor: mePayload.actor.fullName,
        permissions: mePayload.permissions,
        tenantName: tenantPayload.tenant.name,
        totalUsers: tenantPayload.totalUsers,
        activeSessions: tenantPayload.activeSessions,
        token: loginPayload.token,
        settings,
        rolesCatalog,
        users,
        clients
      });
    } catch {
      setState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/platform/users/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          user: {
            fullName: newUserName,
            email: newUserEmail,
            password: newUserPassword,
            roleCode: newUserRole
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo crear el usuario.' });
        return;
      }

      const users = await loadUsers(state.token);

      setState({
        ...state,
        totalUsers: users.length,
        users
      });
      setCreateUserState({ status: 'success', message: 'Usuario creado y listado actualizado.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleCreateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/clients/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          client: {
            fullName: clientName,
            email: clientEmail,
            phone: clientPhone,
            segment: clientSegment,
            notes: clientNotes
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo crear el cliente.' });
        return;
      }

      const clients = await loadClients(state.token);

      setState({
        ...state,
        clients
      });
      setCreateUserState({ status: 'success', message: 'Cliente creado.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleUpdateSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setSaveSettingsState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/platform/settings/update`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          settings: {
            brandingName,
            defaultLocale,
            timezone
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setSaveSettingsState({ status: 'error', message: payload.message ?? 'No se pudieron actualizar los ajustes.' });
        return;
      }

      setState({
        ...state,
        settings: payload,
        tenantName: payload.brandingName
      });
      setSaveSettingsState({ status: 'success', message: 'Ajustes actualizados.' });
    } catch {
      setSaveSettingsState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleChangeUserRole(userId: string, roleCode: string) {
    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/platform/users/role`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          update: {
            userId,
            roleCode
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo actualizar el rol.' });
        return;
      }

      const users = await loadUsers(state.token);

      setState({
        ...state,
        users
      });
      setCreateUserState({ status: 'success', message: 'Rol actualizado.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleLogout() {
    if (state.status !== 'success') {
      return;
    }

    await fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token: state.token })
    });

    setState({ status: 'idle' });
    setCreateUserState({ status: 'idle' });
    setSaveSettingsState({ status: 'idle' });
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
            <button className="secondary-action" onClick={handleLogout} type="button">
              Cerrar sesion
            </button>
          </div>
          <form className="create-user-form" onSubmit={handleUpdateSettings}>
            <label>
              <span>Marca</span>
              <input value={brandingName} onChange={(event) => setBrandingName(event.target.value)} type="text" />
            </label>
            <label>
              <span>Locale</span>
              <input value={defaultLocale} onChange={(event) => setDefaultLocale(event.target.value)} type="text" />
            </label>
            <label>
              <span>Timezone</span>
              <input value={timezone} onChange={(event) => setTimezone(event.target.value)} type="text" />
            </label>
            <button type="submit" disabled={saveSettingsState.status === 'loading'}>
              Guardar ajustes
            </button>
          </form>
          <p className={`login-status login-status--${saveSettingsState.status}`}>
            {saveSettingsState.status === 'idle'
              ? 'Puedes actualizar la configuracion base del tenant.'
              : saveSettingsState.status === 'loading'
                ? 'Guardando ajustes...'
                : saveSettingsState.message}
          </p>
          <div className="permission-list">
            {state.permissions.map((permission) => (
              <span key={permission} className="module-pill">
                {permission}
              </span>
            ))}
          </div>
          <section className="users-section">
            <div className="users-section__header">
              <h3>Usuarios del tenant</h3>
              <p>Primer CRUD operativo del nucleo de plataforma.</p>
            </div>
            <div className="users-grid">
              {state.users.map((user) => (
                <article key={user.id} className="user-card">
                  <strong>{user.fullName}</strong>
                  <span>{user.email}</span>
                  <span>{user.status}</span>
                  <label>
                    <span>Rol actual</span>
                    <select
                      value={user.roles[0] ?? 'viewer'}
                      onChange={(event) => void handleChangeUserRole(user.id, event.target.value)}
                    >
                      {state.rolesCatalog.map((role) => (
                        <option key={role.id} value={role.code}>
                          {role.code}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="permission-list">
                    {user.roles.map((role) => (
                      <span key={role} className="module-pill module-pill--accent">
                        {role}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <form className="create-user-form" onSubmit={handleCreateUser}>
              <label>
                <span>Nombre</span>
                <input value={newUserName} onChange={(event) => setNewUserName(event.target.value)} type="text" />
              </label>
              <label>
                <span>Email</span>
                <input value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} type="email" />
              </label>
              <label>
                <span>Contrasena</span>
                <input value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} type="password" />
              </label>
              <label>
                <span>Rol</span>
                <select value={newUserRole} onChange={(event) => setNewUserRole(event.target.value as typeof newUserRole)}>
                  <option value="admin">admin</option>
                  <option value="manager">manager</option>
                  <option value="operator">operator</option>
                  <option value="viewer">viewer</option>
                </select>
              </label>
              <button type="submit" disabled={createUserState.status === 'loading'}>
                {createUserState.status === 'loading' ? 'Creando...' : 'Crear usuario'}
              </button>
            </form>
            <p className={`login-status login-status--${createUserState.status}`}>
              {createUserState.status === 'idle'
                ? 'Puedes crear usuarios y reasignar roles del tenant desde este panel.'
                : createUserState.status === 'loading'
                  ? 'Aplicando cambios...'
                  : createUserState.message}
            </p>
          </section>
          <section className="users-section">
            <div className="users-section__header">
              <h3>Clientes</h3>
              <p>Primer vertical de negocio conectado al nucleo persistido.</p>
            </div>
            <div className="users-grid">
              {state.clients.map((client) => (
                <article key={client.id} className="user-card">
                  <strong>{client.fullName}</strong>
                  <span>{client.email ?? 'sin email'}</span>
                  <span>{client.phone ?? 'sin telefono'}</span>
                  <div className="permission-list">
                    <span className="module-pill module-pill--accent">{client.segment}</span>
                  </div>
                  {client.notes ? <span>{client.notes}</span> : null}
                </article>
              ))}
            </div>
            <form className="create-user-form" onSubmit={handleCreateClient}>
              <label>
                <span>Nombre</span>
                <input value={clientName} onChange={(event) => setClientName(event.target.value)} type="text" />
              </label>
              <label>
                <span>Email</span>
                <input value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} type="email" />
              </label>
              <label>
                <span>Telefono</span>
                <input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} type="text" />
              </label>
              <label>
                <span>Segmento</span>
                <input value={clientSegment} onChange={(event) => setClientSegment(event.target.value)} type="text" />
              </label>
              <label>
                <span>Notas</span>
                <input value={clientNotes} onChange={(event) => setClientNotes(event.target.value)} type="text" />
              </label>
              <button type="submit" disabled={createUserState.status === 'loading'}>
                Crear cliente
              </button>
            </form>
          </section>
        </>
      ) : null}
    </section>
  );
}
