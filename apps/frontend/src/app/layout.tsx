import './global.css';
import { Inter } from 'next/font/google';
import { Navigation } from '../components/navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Platform',
  description: 'Campaign platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background font-sans text-foreground antialiased">
        <Navigation />
        {children}
      </body>
    </html>
  )
}
