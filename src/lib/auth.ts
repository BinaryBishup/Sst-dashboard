import { supabase } from './supabase'
import { Database } from './database.types'

type SystemUser = Database['public']['Tables']['system_users']['Row']

export class AuthService {
  // Sign in with email and password
  static async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    // Update last login
    if (data.user) {
      await this.updateLastLogin(data.user.id)
    }
    
    return data
  }

  // Sign in with phone and password
  static async signInWithPhone(phone: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    })
    
    if (error) throw error
    
    // Update last login
    if (data.user) {
      await this.updateLastLogin(data.user.id)
    }
    
    return data
  }

  // Sign in with OTP (phone verification)
  static async signInWithOtp(phone: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    })
    
    if (error) throw error
    return data
  }

  // Verify OTP
  static async verifyOtp(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    })
    
    if (error) throw error
    
    // Update last login
    if (data.user) {
      await this.updateLastLogin(data.user.id)
    }
    
    return data
  }

  // Sign up new system user (admin only)
  static async createSystemUser(userData: {
    email?: string
    phone?: string
    password: string
    full_name: string
    role?: 'admin' | 'manager' | 'staff'
  }) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role || 'staff'
      }
    })
    
    if (error) throw error
    return data
  }

  // Get current user profile
  static async getCurrentUserProfile(): Promise<SystemUser | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null
    
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .eq('auth_id', user.id)
      .single()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    
    return data
  }

  // Update user profile
  static async updateUserProfile(updates: Partial<SystemUser>) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('No authenticated user')
    
    const { data, error } = await supabase
      .from('system_users')
      .update(updates)
      .eq('auth_id', user.id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Update last login timestamp
  private static async updateLastLogin(authId: string) {
    await supabase
      .from('system_users')
      .update({ last_login: new Date().toISOString() })
      .eq('auth_id', authId)
  }

  // Sign out
  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Get all system users (admin only)
  static async getAllSystemUsers(): Promise<SystemUser[]> {
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Update user role/status (admin only)
  static async updateSystemUser(userId: string, updates: Partial<SystemUser>) {
    const { data, error } = await supabase
      .from('system_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Delete system user (admin only)
  static async deleteSystemUser(userId: string) {
    const { error } = await supabase
      .from('system_users')
      .delete()
      .eq('id', userId)
    
    if (error) throw error
  }
}