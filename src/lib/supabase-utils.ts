import { supabase, supabaseAdmin } from './supabase'
import { Database } from './database.types'

type Tables = Database['public']['Tables']

// Image upload utility
export async function uploadImage(file: File, bucket: string = 'images'): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Upload API error:', error)
      throw new Error(error.error || 'Failed to upload image')
    }

    const { url } = await response.json()
    return url
  } catch (error) {
    console.error('Error uploading image:', error)
    // Return null to continue without image
    return null
  }
}

// Products CRUD
export const productsService = {
  async create(product: Tables['products']['Insert']) {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create product')
    }
    
    return await response.json()
  },

  async update(id: string, product: Tables['products']['Update']) {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update product')
    }
    
    return await response.json()
  },

  async delete(id: string) {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete product')
    }
    
    return await response.json()
  }
}

// Categories CRUD
export const categoriesService = {
  async create(category: Tables['categories']['Insert']) {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create category')
    }
    
    return await response.json()
  },

  async update(id: string, category: Tables['categories']['Update']) {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update category')
    }
    
    return await response.json()
  },

  async delete(id: string) {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete category')
    }
    
    return await response.json()
  }
}

// Combos CRUD
export const combosService = {
  async create(combo: Tables['combos']['Insert']) {
    const response = await fetch('/api/combos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(combo),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create combo')
    }
    
    return await response.json()
  },

  async update(id: string, combo: Tables['combos']['Update']) {
    const response = await fetch(`/api/combos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(combo),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update combo')
    }
    
    return await response.json()
  },

  async delete(id: string) {
    const response = await fetch(`/api/combos/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete combo')
    }
    
    return await response.json()
  }
}

// Add-ons CRUD
export const addonsService = {
  async create(addon: Tables['cart_addons']['Insert']) {
    const response = await fetch('/api/addons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addon),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create addon')
    }
    
    return await response.json()
  },

  async update(id: number, addon: Tables['cart_addons']['Update']) {
    const response = await fetch(`/api/addons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addon),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update addon')
    }
    
    return await response.json()
  },

  async delete(id: number) {
    const response = await fetch(`/api/addons/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete addon')
    }
    
    return await response.json()
  }
}

// Promo codes CRUD
export const promoCodesService = {
  async create(promoCode: Tables['promo_codes']['Insert']) {
    const response = await fetch('/api/promo-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promoCode),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create promo code')
    }
    
    return await response.json()
  },

  async update(id: string, promoCode: Tables['promo_codes']['Update']) {
    const response = await fetch(`/api/promo-codes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promoCode),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update promo code')
    }
    
    return await response.json()
  },

  async delete(id: string) {
    const response = await fetch(`/api/promo-codes/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete promo code')
    }
    
    return await response.json()
  }
}

// Delivery partners CRUD
export const deliveryPartnersService = {
  async getAll() {
    const response = await fetch('/api/delivery-partners')
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch delivery partners')
    }
    
    return await response.json()
  },

  async create(partner: Tables['delivery_partners']['Insert']) {
    const response = await fetch('/api/delivery-partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partner),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create delivery partner')
    }
    
    return await response.json()
  },

  async update(id: string, partner: Tables['delivery_partners']['Update']) {
    const response = await fetch(`/api/delivery-partners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partner),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update delivery partner')
    }
    
    return await response.json()
  },

  async delete(id: string) {
    const response = await fetch(`/api/delivery-partners/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete delivery partner')
    }
    
    return await response.json()
  }
}

// Profiles service (for users management)
export const profilesService = {
  async update(id: string, profile: Tables['profiles']['Update']) {
    const response = await fetch(`/api/profiles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update profile')
    }
    
    return await response.json()
  }
}

// Orders service (updated for new simplified schema)
export const ordersService = {
  async getAll(status?: string) {
    const url = status ? `/api/orders?status=${status}` : '/api/orders'
    const response = await fetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch orders')
    }
    
    return await response.json()
  },

  async getById(id: string) {
    const response = await fetch(`/api/orders/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch order')
    }
    
    return await response.json()
  },

  async create(order: Tables['orders']['Insert']) {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create order')
    }
    
    return await response.json()
  },

  async update(id: string, order: Tables['orders']['Update']) {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update order')
    }
    
    return await response.json()
  },

  async assignDeliveryPartner(orderId: string, partnerId: string) {
    // Update order with assigned partner
    const orderUpdate = await this.update(orderId, {
      delivery_partner_id: partnerId,
      status: 'out_for_delivery'
    })

    // Mark delivery partner as unavailable
    await deliveryPartnersService.update(partnerId, {
      is_available: false
    })

    return orderUpdate
  }
}

// Utility function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}