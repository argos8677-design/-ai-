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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      content_history: {
        Row: {
          channels: string[]
          client_id: string
          created_at: string
          extra_request: string | null
          id: string
          mode: string
          product_id: string | null
          product_name: string
          purposes: string[]
          rating: number | null
          targets: string[]
          title: string | null
          user_id: string | null
        }
        Insert: {
          channels?: string[]
          client_id: string
          created_at?: string
          extra_request?: string | null
          id?: string
          mode?: string
          product_id?: string | null
          product_name: string
          purposes?: string[]
          rating?: number | null
          targets?: string[]
          title?: string | null
          user_id?: string | null
        }
        Update: {
          channels?: string[]
          client_id?: string
          created_at?: string
          extra_request?: string | null
          id?: string
          mode?: string
          product_id?: string | null
          product_name?: string
          purposes?: string[]
          rating?: number | null
          targets?: string[]
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_results: {
        Row: {
          channel: string
          content: Json
          created_at: string
          history_id: string
          id: string
          mode: string
          updated_at: string
        }
        Insert: {
          channel: string
          content: Json
          created_at?: string
          history_id: string
          id?: string
          mode?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          content?: Json
          created_at?: string
          history_id?: string
          id?: string
          mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_results_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "content_history"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          advantages: string[]
          battery_swap_info: string | null
          created_at: string
          deposit: number | null
          id: string
          is_active: boolean
          is_sample: boolean
          monthly_fee: number | null
          name: string
          rent_period: string | null
          rent_type: string
          sort_order: number
          updated_at: string
          vehicle_model: string | null
        }
        Insert: {
          advantages?: string[]
          battery_swap_info?: string | null
          created_at?: string
          deposit?: number | null
          id?: string
          is_active?: boolean
          is_sample?: boolean
          monthly_fee?: number | null
          name: string
          rent_period?: string | null
          rent_type: string
          sort_order?: number
          updated_at?: string
          vehicle_model?: string | null
        }
        Update: {
          advantages?: string[]
          battery_swap_info?: string | null
          created_at?: string
          deposit?: number | null
          id?: string
          is_active?: boolean
          is_sample?: boolean
          monthly_fee?: number | null
          name?: string
          rent_period?: string | null
          rent_type?: string
          sort_order?: number
          updated_at?: string
          vehicle_model?: string | null
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          channel: string
          id: string
          instructions: string
          label: string
          output_schema: string
          updated_at: string
        }
        Insert: {
          channel: string
          id?: string
          instructions: string
          label: string
          output_schema: string
          updated_at?: string
        }
        Update: {
          channel?: string
          id?: string
          instructions?: string
          label?: string
          output_schema?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          client_id: string
          created_at: string
          display_name: string | null
          id: string
          role: string
        }
        Insert: {
          client_id: string
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
