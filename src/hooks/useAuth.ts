import { useState, useEffect, createContext, useContext } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthService } from '@/lib/auth'
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

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [systemUser, setSystemUser] = useState<SystemUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadSystemUser(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadSystemUser(session.user.id)
        } else {
          setSystemUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadSystemUser = async (authId: string) => {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .eq('auth_id', authId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading system user:', error)
      } else {
        setSystemUser(data)
      }
    } catch (error) {
      console.error('Error loading system user:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      await AuthService.signInWithEmail(email, password)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signInWithPhone = async (phone: string, password: string) => {
    setLoading(true)
    try {
      await AuthService.signInWithPhone(phone, password)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signInWithOtp = async (phone: string) => {
    setLoading(true)
    try {
      return await AuthService.signInWithOtp(phone)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const verifyOtp = async (phone: string, token: string) => {
    setLoading(true)
    try {
      await AuthService.verifyOtp(phone, token)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    await AuthService.signOut()
  }

  const updateProfile = async (updates: Partial<SystemUser>) => {
    if (!user) throw new Error('No authenticated user')
    
    const updatedUser = await AuthService.updateUserProfile(updates)
    setSystemUser(updatedUser)
  }

  const refreshProfile = async () => {
    if (!user) return
    await loadSystemUser(user.id)
  }

  return {
    user,
    systemUser,
    loading,
    signIn,
    signInWithPhone,
    signInWithOtp,
    verifyOtp,
    signOut,
    updateProfile,
    refreshProfile
  }
}