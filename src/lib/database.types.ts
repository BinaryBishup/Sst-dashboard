export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // New simplified orders table
      orders: {
        Row: {
          id: string
          order_number: string
          contact_name: string
          contact_phone: string
          user_id: string | null
          items: Json // JSONB array of order items
          total_amount: number
          subtotal: number | null
          tax_amount: number | null
          delivery_fee: number | null
          discount_amount: number | null
          status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
          delivery_partner_id: string | null
          delivery_notes: string | null
          delivery_address: Json | null
          special_instructions: string | null
          created_at: string
          updated_at: string
          estimated_delivery_time: string | null
          payment_method: string | null
          payment_status: string | null
          pos: boolean | null
        }
        Insert: {
          id?: string
          order_number: string
          contact_name: string
          contact_phone: string
          user_id?: string | null
          items: Json
          total_amount: number
          subtotal?: number | null
          tax_amount?: number | null
          delivery_fee?: number | null
          discount_amount?: number | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
          delivery_partner_id?: string | null
          delivery_notes?: string | null
          delivery_address?: Json | null
          special_instructions?: string | null
          created_at?: string
          updated_at?: string
          estimated_delivery_time?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pos?: boolean | null
        }
        Update: {
          id?: string
          order_number?: string
          contact_name?: string
          contact_phone?: string
          user_id?: string | null
          items?: Json
          total_amount?: number
          subtotal?: number | null
          tax_amount?: number | null
          delivery_fee?: number | null
          discount_amount?: number | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
          delivery_partner_id?: string | null
          delivery_notes?: string | null
          delivery_address?: Json | null
          special_instructions?: string | null
          created_at?: string
          updated_at?: string
          estimated_delivery_time?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pos?: boolean | null
        }
      }

      // Products table (keeping the same for reference)
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          images: string[] | null
          category: string | null
          delivery_time: string | null
          is_customizable: boolean | null
          created_at: string
          updated_at: string
          category_id: string | null
          is_featured: boolean | null
          is_active: boolean | null
          stock_quantity: number | null
          max_order_quantity: number | null
          tags: string | null
          rating: number | null
          review_count: number | null
          attributes: Json | null
          message: boolean | null
          product_type: string | null
          combo_items: Json | null
          item_type: string | null
          online_ordering: boolean | null
          require_image: boolean | null
          require_name: boolean | null
          barcode: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          images?: string[] | null
          category?: string | null
          delivery_time?: string | null
          is_customizable?: boolean | null
          created_at?: string
          updated_at?: string
          category_id?: string | null
          is_featured?: boolean | null
          is_active?: boolean | null
          stock_quantity?: number | null
          max_order_quantity?: number | null
          tags?: string | null
          rating?: number | null
          review_count?: number | null
          attributes?: Json | null
          message?: boolean | null
          product_type?: string | null
          combo_items?: Json | null
          item_type?: string | null
          online_ordering?: boolean | null
          require_image?: boolean | null
          require_name?: boolean | null
          barcode?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          images?: string[] | null
          category?: string | null
          delivery_time?: string | null
          is_customizable?: boolean | null
          created_at?: string
          updated_at?: string
          category_id?: string | null
          is_featured?: boolean | null
          is_active?: boolean | null
          stock_quantity?: number | null
          max_order_quantity?: number | null
          tags?: string | null
          rating?: number | null
          review_count?: number | null
          attributes?: Json | null
          message?: boolean | null
          product_type?: string | null
          combo_items?: Json | null
          item_type?: string | null
          online_ordering?: boolean | null
          require_image?: boolean | null
          require_name?: boolean | null
          barcode?: string | null
        }
      }
      
      // Categories table (keeping the same)
      categories: {
        Row: {
          id: string
          name: string
          slug: string | null
          description: string | null
          image_url: string | null
          display_order: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          description?: string | null
          image_url?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          description?: string | null
          image_url?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }

      // Combos table (keeping the same)
      combos: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          original_price: number
          discounted_price: number
          is_active: boolean | null
          display_order: number | null
          created_at: string
          updated_at: string
          products: Json | null
          max_order_quantity: number | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          original_price: number
          discounted_price: number
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
          products?: Json | null
          max_order_quantity?: number | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          original_price?: number
          discounted_price?: number
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
          products?: Json | null
          max_order_quantity?: number | null
        }
      }

      // Cart addons table (keeping the same)
      cart_addons: {
        Row: {
          id: number
          name: string | null
          image_url: string | null
          price: number | null
          status: boolean | null
        }
        Insert: {
          id?: number
          name?: string | null
          image_url?: string | null
          price?: number | null
          status?: boolean | null
        }
        Update: {
          id?: number
          name?: string | null
          image_url?: string | null
          price?: number | null
          status?: boolean | null
        }
      }
      
      // Profiles table (keeping the same)
      profiles: {
        Row: {
          id: string
          phone: string | null
          created_at: string | null
          updated_at: string | null
          first_name: string | null
          last_name: string | null
          email: string | null
          avatar_url: string | null
          date_of_birth: string | null
          loyalty_points: number | null
          total_orders: number | null
          total_spent: number | null
          user_preferences: string | null
          full_name: string | null
        }
        Insert: {
          id?: string
          phone?: string | null
          created_at?: string | null
          updated_at?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          loyalty_points?: number | null
          total_orders?: number | null
          total_spent?: number | null
          user_preferences?: string | null
          full_name?: string | null
        }
        Update: {
          id?: string
          phone?: string | null
          created_at?: string | null
          updated_at?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          loyalty_points?: number | null
          total_orders?: number | null
          total_spent?: number | null
          user_preferences?: string | null
          full_name?: string | null
        }
      }
      
      // Delivery partners table (keeping the same)
      delivery_partners: {
        Row: {
          id: string
          name: string | null
          phone: string | null
          email: string | null
          avatar_url: string | null
          vehicle_type: string | null
          vehicle_number: string | null
          current_location: string | null
          is_available: boolean | null
          is_active: boolean | null
          rating: number | null
          total_deliveries: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          vehicle_type?: string | null
          vehicle_number?: string | null
          current_location?: string | null
          is_available?: boolean | null
          is_active?: boolean | null
          rating?: number | null
          total_deliveries?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          vehicle_type?: string | null
          vehicle_number?: string | null
          current_location?: string | null
          is_available?: boolean | null
          is_active?: boolean | null
          rating?: number | null
          total_deliveries?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      

      // Promo codes table (keeping the same)
      promo_codes: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: string
          discount_value: number
          minimum_amount: number | null
          maximum_discount: number | null
          valid_from: string
          valid_until: string
          times_used: number | null
          usage_limit: number | null
          applicable_categories: Json | null
          user_id: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type: string
          discount_value: number
          minimum_amount?: number | null
          maximum_discount?: number | null
          valid_from: string
          valid_until: string
          times_used?: number | null
          usage_limit?: number | null
          applicable_categories?: Json | null
          user_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          minimum_amount?: number | null
          maximum_discount?: number | null
          valid_from?: string
          valid_until?: string
          times_used?: number | null
          usage_limit?: number | null
          applicable_categories?: Json | null
          user_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for the new JSONB item structure
export interface OrderItem {
  id: string
  type: 'product' | 'combo' | 'addon'
  name: string
  image_url?: string
  quantity: number
  base_price: number
  total_price: number
  variations?: {
    [key: string]: {
      name: string
      price_adjustment: number
    }
  }
  special_instructions?: string
  is_gift_wrapped?: boolean
  combo_items?: OrderItem[]
}