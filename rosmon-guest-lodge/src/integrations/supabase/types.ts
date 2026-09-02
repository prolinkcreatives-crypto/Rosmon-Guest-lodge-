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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: string
          note: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          note?: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_status: Database["public"]["Enums"]["booking_status"]
          check_in: string
          check_out: string
          created_at: string
          created_by: string | null
          guest_email: string | null
          guest_name: string
          guest_phone: string
          guests: number
          hold_expires_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          price_per_night: number
          reference: string
          room_type_id: string
          room_unit_id: string | null
          source: string
          total: number
          updated_at: string
        }
        Insert: {
          booking_status?: Database["public"]["Enums"]["booking_status"]
          check_in: string
          check_out: string
          created_at?: string
          created_by?: string | null
          guest_email?: string | null
          guest_name: string
          guest_phone: string
          guests?: number
          hold_expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          price_per_night: number
          reference: string
          room_type_id: string
          room_unit_id?: string | null
          source?: string
          total: number
          updated_at?: string
        }
        Update: {
          booking_status?: Database["public"]["Enums"]["booking_status"]
          check_in?: string
          check_out?: string
          created_at?: string
          created_by?: string | null
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string
          guests?: number
          hold_expires_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          price_per_night?: number
          reference?: string
          room_type_id?: string
          room_unit_id?: string | null
          source?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_unit_id_fkey"
            columns: ["room_unit_id"]
            isOneToOne: false
            referencedRelation: "room_units"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          alt: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          sort_order: number
          storage_path: string
          updated_at: string
          url: string
        }
        Insert: {
          alt?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          sort_order?: number
          storage_path: string
          updated_at?: string
          url: string
        }
        Update: {
          alt?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          sort_order?: number
          storage_path?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      inventory_blocks: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          kind: string
          reason: string | null
          room_type_id: string | null
          room_unit_id: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          kind?: string
          reason?: string | null
          room_type_id?: string | null
          room_unit_id?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          kind?: string
          reason?: string | null
          room_type_id?: string | null
          room_unit_id?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_blocks_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_blocks_room_unit_id_fkey"
            columns: ["room_unit_id"]
            isOneToOne: false
            referencedRelation: "room_units"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          amenities: string[]
          created_at: string
          description: string | null
          descriptor: string | null
          id: string
          is_active: boolean
          max_guests: number
          name: string
          price_per_night: number
          sort_order: number
          unit_count: number
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          created_at?: string
          description?: string | null
          descriptor?: string | null
          id: string
          is_active?: boolean
          max_guests?: number
          name: string
          price_per_night: number
          sort_order?: number
          unit_count?: number
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          created_at?: string
          description?: string | null
          descriptor?: string | null
          id?: string
          is_active?: boolean
          max_guests?: number
          name?: string
          price_per_night?: number
          sort_order?: number
          unit_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      room_units: {
        Row: {
          created_at: string
          id: string
          internal_label: string
          is_active: boolean
          notes: string | null
          room_type_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          internal_label: string
          is_active?: boolean
          notes?: string | null
          room_type_id: string
        }
        Update: {
          created_at?: string
          id?: string
          internal_label?: string
          is_active?: boolean
          notes?: string | null
          room_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_units_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          created_by: string | null
          guest_name: string
          id: string
          is_published: boolean
          quote: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          guest_name: string
          id?: string
          is_published?: boolean
          quote: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          guest_name?: string
          id?: string
          is_published?: boolean
          quote?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
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
      can_manage: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "receptionist"
      booking_status:
        | "pending_payment"
        | "payment_submitted"
        | "confirmed"
        | "cancelled"
        | "checked_in"
        | "checked_out"
        | "expired"
      payment_status:
        | "unpaid"
        | "submitted"
        | "verified"
        | "failed"
        | "refunded"
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
      app_role: ["admin", "manager", "receptionist"],
      booking_status: [
        "pending_payment",
        "payment_submitted",
        "confirmed",
        "cancelled",
        "checked_in",
        "checked_out",
        "expired",
      ],
      payment_status: ["unpaid", "submitted", "verified", "failed", "refunded"],
    },
  },
} as const
