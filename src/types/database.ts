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
      asset_documents: {
        Row: {
          asset_id: string
          created_at: string | null
          description: string | null
          document_type: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          name: string
          organization_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          description?: string | null
          document_type: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          description?: string | null
          document_type?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_documents_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_lifecycle_events: {
        Row: {
          asset_id: string
          attachments: string[] | null
          cost_eur: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          event_date: string
          event_type: string
          external_company: string | null
          id: string
          metadata: Json | null
          next_service_date: string | null
          notes: string | null
          organization_id: string
          performed_by: string | null
          performed_by_user_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          asset_id: string
          attachments?: string[] | null
          cost_eur?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type: string
          external_company?: string | null
          id?: string
          metadata?: Json | null
          next_service_date?: string | null
          notes?: string | null
          organization_id: string
          performed_by?: string | null
          performed_by_user_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          asset_id?: string
          attachments?: string[] | null
          cost_eur?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          external_company?: string | null
          id?: string
          metadata?: Json | null
          next_service_date?: string | null
          notes?: string | null
          organization_id?: string
          performed_by?: string | null
          performed_by_user_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_lifecycle_events_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_lifecycle_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_sensor_readings: {
        Row: {
          asset_id: string
          id: string
          metadata: Json | null
          organization_id: string
          recorded_at: string
          sensor_id: string | null
          sensor_type: string | null
          unit: string | null
          value: number
        }
        Insert: {
          asset_id: string
          id?: string
          metadata?: Json | null
          organization_id: string
          recorded_at?: string
          sensor_id?: string | null
          sensor_type?: string | null
          unit?: string | null
          value: number
        }
        Update: {
          asset_id?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          recorded_at?: string
          sensor_id?: string | null
          sensor_type?: string | null
          unit?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_sensor_readings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_sensor_readings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_tags: {
        Row: {
          asset_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          raw_value: string | null
          tag_type: string
          tag_value: string
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          raw_value?: string | null
          tag_type: string
          tag_value: string
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          raw_value?: string | null
          tag_type?: string
          tag_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_tags_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_templates: {
        Row: {
          category: string | null
          commercial_fields: Json | null
          created_at: string | null
          created_by: string | null
          default_values: Json | null
          description: string | null
          icon: string | null
          id: string
          manufacturer: string | null
          name: string
          organization_id: string
          technical_fields: Json | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          commercial_fields?: Json | null
          created_at?: string | null
          created_by?: string | null
          default_values?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          manufacturer?: string | null
          name: string
          organization_id: string
          technical_fields?: Json | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          commercial_fields?: Json | null
          created_at?: string | null
          created_by?: string | null
          default_values?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          manufacturer?: string | null
          name?: string
          organization_id?: string
          technical_fields?: Json | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          article_number: string | null
          barcode: string | null
          category: string | null
          commercial_data: Json | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          deleted_at: string | null
          description: string | null
          id: string
          image_urls: string[] | null
          location: string | null
          manufacturer: string | null
          nfc_uid: string | null
          operating_hours_minutes: number | null
          order_number: string | null
          organization_id: string
          qr_code: string | null
          serial_number: string | null
          status: string | null
          tags: string[] | null
          technical_data: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          article_number?: string | null
          barcode?: string | null
          category?: string | null
          commercial_data?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          location?: string | null
          manufacturer?: string | null
          nfc_uid?: string | null
          operating_hours_minutes?: number | null
          order_number?: string | null
          organization_id: string
          qr_code?: string | null
          serial_number?: string | null
          status?: string | null
          tags?: string[] | null
          technical_data?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          article_number?: string | null
          barcode?: string | null
          category?: string | null
          commercial_data?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          location?: string | null
          manufacturer?: string | null
          nfc_uid?: string | null
          operating_hours_minutes?: number | null
          order_number?: string | null
          organization_id?: string
          qr_code?: string | null
          serial_number?: string | null
          status?: string | null
          tags?: string[] | null
          technical_data?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          organization_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          flag_key: string
          id: string
          is_enabled: boolean | null
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          flag_key: string
          id?: string
          is_enabled?: boolean | null
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          flag_key?: string
          id?: string
          is_enabled?: boolean | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          email: string
          id: string
          invitation_accepted_at: string | null
          invitation_token: string | null
          invited_by: string | null
          organization_id: string
          role_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          invitation_accepted_at?: string | null
          invitation_token?: string | null
          invited_by?: string | null
          organization_id: string
          role_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          invitation_accepted_at?: string | null
          invitation_token?: string | null
          invited_by?: string | null
          organization_id?: string
          role_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          asset_limit: number
          billing_email: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          logo_url: string | null
          name: string
          plan: string
          settings: Json | null
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          asset_limit?: number
          billing_email?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string
          settings?: Json | null
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_limit?: number
          billing_email?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string
          settings?: Json | null
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_platform_admin: boolean | null
          organization_id: string | null
          phone: string | null
          preferred_language: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_platform_admin?: boolean | null
          organization_id?: string | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_platform_admin?: boolean | null
          organization_id?: string | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          organization_id: string
          permissions: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          organization_id: string
          permissions?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          organization_id?: string
          permissions?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: { Args: never; Returns: string }
      is_platform_admin: { Args: never; Returns: boolean }
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
    Enums: {},
  },
} as const
