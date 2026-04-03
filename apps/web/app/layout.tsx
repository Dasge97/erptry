import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'ERPTRY',
  description: 'Base de ERP modular y multiempresa para salida profesional a mercado.'
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
