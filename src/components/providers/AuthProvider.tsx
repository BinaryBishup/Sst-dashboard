"use client"

import { createContext, useContext, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { useAuthState } from '@/hooks/useAuth'
import { Database } from '@/lib/database.types'

type SystemUser = Database['public']['Tables']['system_users']['Row']

interface AuthContextType {
  user: User | null
  systemUser: SystemUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithPhone: (phone: string, password: string) => Promise<void>
  signInWithOtp: (phone: string) => Promise<{ session: any }>
  verifyOtp: (phone: string, token: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<SystemUser>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthState()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}