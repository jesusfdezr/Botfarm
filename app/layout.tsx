import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bot Army | Granja de Bots Jerarquica',
  description: 'Sistema de orquestacion de bots con IA Qwen 3.5 y Supabase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
