import type { PropsWithChildren } from 'react';

import React from 'react';

type ShellCardProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
}>;

export function ShellCard({ title, eyebrow, children }: ShellCardProps) {
  return (
    <section
      style={{
        border: '1px solid rgba(12, 45, 74, 0.12)',
        borderRadius: 24,
        padding: 24,
        background: 'rgba(255,255,255,0.9)',
        boxShadow: '0 18px 60px rgba(28, 52, 84, 0.08)'
      }}
    >
      {eyebrow ? (
        <p style={{ margin: 0, color: '#5b6d7e', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {eyebrow}
        </p>
      ) : null}
      <h3 style={{ margin: '12px 0', fontSize: 24, color: '#0f2740' }}>{title}</h3>
      <div style={{ color: '#32475b', lineHeight: 1.6 }}>{children}</div>
    </section>
  );
}

type StatPillProps = {
  label: string;
  value: string;
};

export function StatPill({ label, value }: StatPillProps) {
  return (
    <div
      style={{
        borderRadius: 999,
        padding: '12px 16px',
        background: '#0f2740',
        color: '#f7fbff',
        display: 'inline-flex',
        gap: 10,
        alignItems: 'center'
      }}
    >
      <span style={{ opacity: 0.72, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
