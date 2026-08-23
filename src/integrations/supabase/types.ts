export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          lat: number | null
          line1: string
          line2: string | null
          lng: number | null
          pincode: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          line1: string
          line2?: string | null
          lng?: number | null
          pincode: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          line1?: string
          line2?: string | null
          lng?: number | null
          pincode?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          qty: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          qty?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          qty?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          icon: string
          id: string
          name_bho: string
          name_bn: string
          name_en: string
          name_hi: string
          slug: string
          sort_order: number
        }
        Insert: {
          icon?: string
          id?: string
          name_bho: string
          name_bn: string
          name_en: string
          name_hi: string
          slug: string
          sort_order?: number
        }
        Update: {
          icon?: string
          id?: string
          name_bho?: string
          name_bn?: string
          name_en?: string
          name_hi?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      delivery_partners: {
        Row: {
          created_at: string
          is_approved: boolean
          is_available: boolean
          name: string
          phone: string
          updated_at: string
          user_id: string
          vehicle: string
        }
        Insert: {
          created_at?: string
          is_approved?: boolean
          is_available?: boolean
          name: string
          phone: string
          updated_at?: string
          user_id: string
          vehicle?: string
        }
        Update: {
          created_at?: string
          is_approved?: boolean
          is_available?: boolean
          name?: string
          phone?: string
          updated_at?: string
          user_id?: string
          vehicle?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          image_url: string | null
          name: string
          order_id: string
          price: number
          product_id: string | null
          qty: number
        }
        Insert: {
          id?: string
          image_url?: string | null
          name: string
          order_id: string
          price: number
          product_id?: string | null
          qty: number
        }
        Update: {
          id?: string
          image_url?: string | null
          name?: string
          order_id?: string
          price?: number
          product_id?: string | null
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: Json
          commission: number
          created_at: string
          customer_id: string
          delivery_fee: number
          delivery_partner_id: string | null
          id: string
          items_total: number
          note: string | null
          order_code: string
          payment_method: string
          shop_id: string
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
        }
        Insert: {
          address: Json
          commission?: number
          created_at?: string
          customer_id: string
          delivery_fee?: number
          delivery_partner_id?: string | null
          id?: string
          items_total?: number
          note?: string | null
          order_code?: string
          payment_method?: string
          shop_id: string
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          address?: Json
          commission?: number
          created_at?: string
          customer_id?: string
          delivery_fee?: number
          delivery_partner_id?: string | null
          id?: string
          items_total?: number
          note?: string | null
          order_code?: string
          payment_method?: string
          shop_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          keywords: string[]
          mrp: number | null
          name: string
          name_hi: string | null
          price: number
          shop_id: string
          stock: number
          unit: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          keywords?: string[]
          mrp?: number | null
          name: string
          name_hi?: string | null
          price: number
          shop_id: string
          stock?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          keywords?: string[]
          mrp?: number | null
          name?: string
          name_hi?: string | null
          price?: number
          shop_id?: string
          stock?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          language?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shops: {
        Row: {
          address: string | null
          area: string | null
          category_id: string | null
          city: string | null
          closes_at: string | null
          commission_pct: number
          created_at: string
          delivery_radius_km: number
          description: string | null
          district: string | null
          gst_number: string | null
          has_gst: boolean
          id: string
          image_url: string | null
          is_active: boolean
          lat: number | null
          lng: number | null
          min_order_amount: number
          name: string
          opens_at: string | null
          owner_id: string | null
          owner_name: string | null
          payment_options: string[]
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          area?: string | null
          category_id?: string | null
          city?: string | null
          closes_at?: string | null
          commission_pct?: number
          created_at?: string
          delivery_radius_km?: number
          description?: string | null
          district?: string | null
          gst_number?: string | null
          has_gst?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          min_order_amount?: number
          name: string
          opens_at?: string | null
          owner_id?: string | null
          owner_name?: string | null
          payment_options?: string[]
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          area?: string | null
          category_id?: string | null
          city?: string | null
          closes_at?: string | null
          commission_pct?: number
          created_at?: string
          delivery_radius_km?: number
          description?: string | null
          district?: string | null
          gst_number?: string | null
          has_gst?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          min_order_amount?: number
          name?: string
          opens_at?: string | null
          owner_id?: string | null
          owner_name?: string | null
          payment_options?: string[]
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shops_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_order: { Args: { _order_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_shop: { Args: { _shop_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "customer" | "seller" | "delivery" | "admin"
      order_status:
        | "placed"
        | "accepted"
        | "rejected"
        | "ready"
        | "picked_up"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "seller", "delivery", "admin"],
      order_status: [
        "placed",
        "accepted",
        "rejected",
        "ready",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
