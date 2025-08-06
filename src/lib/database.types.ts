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
      // Products table (based on your actual schema)
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
        }
      }
      
      // Categories table (based on your actual schema)
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

      // Combos table (based on your actual schema)
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

      // Cart addons table (based on your actual schema)
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
      
      // Orders table (matching actual schema)
      orders: {
        Row: {
          id: string
          user_id: string | null
          order_number: string | null
          total: number
          subtotal: number | null
          tax: number | null
          delivery_fee: number | null
          total_amount: number | null
          reward_points_used: number | null
          reward_discount: number | null
          status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
          payment_method: string | null
          payment_status: string | null
          delivery_notes: string | null
          delivery_address: Json | null
          delivery_phone: string | null
          assigned_partner_id: string | null
          special_instructions: string | null
          customer_charge_date: string | null
          product_snapshot: Json | null
          estimated_delivery_time: string | null
          created_at: string | null
          updated_at: string | null
          addons: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_number?: string | null
          total: number
          subtotal?: number | null
          tax?: number | null
          delivery_fee?: number | null
          total_amount?: number | null
          reward_points_used?: number | null
          reward_discount?: number | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
          payment_method?: string | null
          payment_status?: string | null
          delivery_notes?: string | null
          delivery_address?: Json | null
          delivery_phone?: string | null
          assigned_partner_id?: string | null
          special_instructions?: string | null
          customer_charge_date?: string | null
          product_snapshot?: Json | null
          estimated_delivery_time?: string | null
          created_at?: string | null
          updated_at?: string | null
          addons?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          order_number?: string | null
          total?: number
          subtotal?: number | null
          tax?: number | null
          delivery_fee?: number | null
          total_amount?: number | null
          reward_points_used?: number | null
          reward_discount?: number | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
          payment_method?: string | null
          payment_status?: string | null
          delivery_notes?: string | null
          delivery_address?: Json | null
          delivery_phone?: string | null
          assigned_partner_id?: string | null
          special_instructions?: string | null
          customer_charge_date?: string | null
          product_snapshot?: Json | null
          estimated_delivery_time?: string | null
          created_at?: string | null
          updated_at?: string | null
          addons?: Json | null
        }
      }

      // Order items table
      order_items: {
        Row: {
          id: string
          order_id: string
          quantity: number
          price: number
          special_instructions: string | null
          created_at: string | null
          custom_charge_data: Json | null
          product_snapshot: Json | null
          gift_wrap: boolean | null
          addons: Json | null
          product_id: string | null
          item_type: string | null
          combo_id: string | null
          product_attributes: Json | null
        }
        Insert: {
          id?: string
          order_id: string
          quantity: number
          price: number
          special_instructions?: string | null
          created_at?: string | null
          custom_charge_data?: Json | null
          product_snapshot?: Json | null
          gift_wrap?: boolean | null
          addons?: Json | null
          product_id?: string | null
          item_type?: string | null
          combo_id?: string | null
          product_attributes?: Json | null
        }
        Update: {
          id?: string
          order_id?: string
          quantity?: number
          price?: number
          special_instructions?: string | null
          created_at?: string | null
          custom_charge_data?: Json | null
          product_snapshot?: Json | null
          gift_wrap?: boolean | null
          addons?: Json | null
          product_id?: string | null
          item_type?: string | null
          combo_id?: string | null
          product_attributes?: Json | null
        }
      }
      
      // Profiles table (matching actual database schema)
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
      
      // Delivery partners table (matching screenshot schema)
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
      
      // Promo codes table (matching actual database schema)
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