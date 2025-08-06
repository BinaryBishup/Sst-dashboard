"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']

export function useOrders() {
  const [orders, setOrders] = useState<Tables['orders']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return { orders, loading, error, refetch: fetchOrders }
}

export function useProducts() {
  const [products, setProducts] = useState<(Tables['products']['Row'] & { categories?: { name: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!products_category_id_fkey (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return { products, loading, error, refetch: fetchProducts }
}

export function useCategories() {
  const [categories, setCategories] = useState<Tables['categories']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return { categories, loading, error, refetch: fetchCategories }
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Tables['profiles']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profiles')
      
      if (!response.ok) {
        throw new Error('Failed to fetch profiles')
      }
      
      const data = await response.json()
      setProfiles(data || [])
    } catch (err) {
      console.error('Error fetching profiles:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  return { profiles, loading, error, refetch: fetchProfiles }
}

// Keep useUsers for backward compatibility
export function useUsers() {
  const { profiles, loading, error, refetch } = useProfiles()
  return { users: profiles, loading, error, refetch }
}

export function useDeliveryPartners() {
  const [deliveryPartners, setDeliveryPartners] = useState<Tables['delivery_partners']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeliveryPartners = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/delivery-partners')
      
      if (!response.ok) {
        throw new Error('Failed to fetch delivery partners')
      }
      
      const data = await response.json()
      setDeliveryPartners(data || [])
    } catch (err) {
      console.error('Error fetching delivery partners:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeliveryPartners()
  }, [])

  return { deliveryPartners, loading, error, refetch: fetchDeliveryPartners }
}

// Keep useDeliveryStaff for backward compatibility
export function useDeliveryStaff() {
  const { deliveryPartners, loading, error, refetch } = useDeliveryPartners()
  return { deliveryStaff: deliveryPartners, loading, error, refetch }
}

export function usePromoCodes() {
  const [promoCodes, setPromoCodes] = useState<Tables['promo_codes']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPromoCodes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/promo-codes')
      
      if (!response.ok) {
        throw new Error('Failed to fetch promo codes')
      }
      
      const data = await response.json()
      setPromoCodes(data || [])
    } catch (err) {
      console.error('Error fetching promo codes:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  return { promoCodes, loading, error, refetch: fetchPromoCodes }
}

// Keep useCoupons for backward compatibility
export function useCoupons() {
  const { promoCodes, loading, error, refetch } = usePromoCodes()
  return { coupons: promoCodes, loading, error, refetch }
}

export function useCombos() {
  const [combos, setCombos] = useState<Tables['combos']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCombos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('combos')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })

      if (error) throw error
      setCombos(data || [])
    } catch (err) {
      console.error('Error fetching combos:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCombos()
  }, [])

  return { combos, loading, error, refetch: fetchCombos }
}

export function useAddons() {
  const [addons, setAddons] = useState<Tables['cart_addons']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAddons = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cart_addons')
        .select('*')
        .order('name')

      if (error) throw error
      setAddons(data || [])
    } catch (err) {
      console.error('Error fetching cart addons:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddons()
  }, [])

  return { addons, loading, error, refetch: fetchAddons }
}

// Dashboard stats hook
export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeUsers: 0,
    totalProducts: 0,
    orderStatusCounts: {
      pending: 0,
      preparing: 0,
      in_transit: 0,
      delivered: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch revenue and order counts
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, status')

      if (ordersError) throw ordersError

      // Fetch user count
      const { count: userCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (usersError) throw usersError

      // Fetch product count
      const { count: productCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (productsError) throw productsError

      // Calculate stats
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      const totalOrders = orders?.length || 0
      
      const orderStatusCounts = orders?.reduce((acc, order) => {
        acc[order.status as keyof typeof acc] = (acc[order.status as keyof typeof acc] || 0) + 1
        return acc
      }, {
        pending: 0,
        preparing: 0,
        in_transit: 0,
        delivered: 0
      }) || {
        pending: 0,
        preparing: 0,
        in_transit: 0,
        delivered: 0
      }

      setStats({
        totalRevenue,
        totalOrders,
        activeUsers: userCount || 0,
        totalProducts: productCount || 0,
        orderStatusCounts
      })
      
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, loading, error, refetch: fetchStats }
}