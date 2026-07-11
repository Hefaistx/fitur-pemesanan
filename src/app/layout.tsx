import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import DevTimePanel from '@/components/DevTimePanel';
import DeliveryAdminPanel from '@/components/DeliveryAdminPanel';

export const metadata: Metadata = {
  title: 'DParagon – Pesan Makanan',
  description: 'Pesan menu Campagna & Jede langsung dari properti DParagon.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>
          <div className="mobile-container">
            {children}
            <DevTimePanel />
            <DeliveryAdminPanel />
          </div>
        </Providers>
      </body>
    </html>
  );
}
