import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Food Delivery Admin Dashboard',
  description: 'Admin panel for managing food delivery services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Temporarily disabled until Supabase is configured */}
        {/* <AuthProvider> */}
          {children}
        {/* </AuthProvider> */}
      </body>
    </html>
  )
}