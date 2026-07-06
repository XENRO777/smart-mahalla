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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      citizens: {
        Row: {
          birth_year: number | null
          created_at: string
          full_name: string
          household: string | null
          id: string
          is_suspicious: boolean
          mahalla: string | null
          mahalla_id: string | null
          notebook: string | null
          phone: string | null
          pinfl: string | null
          status: string
          tokens: number
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          full_name: string
          household?: string | null
          id?: string
          is_suspicious?: boolean
          mahalla?: string | null
          mahalla_id?: string | null
          notebook?: string | null
          phone?: string | null
          pinfl?: string | null
          status?: string
          tokens?: number
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          full_name?: string
          household?: string | null
          id?: string
          is_suspicious?: boolean
          mahalla?: string | null
          mahalla_id?: string | null
          notebook?: string | null
          phone?: string | null
          pinfl?: string | null
          status?: string
          tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "citizens_mahalla_id_fkey"
            columns: ["mahalla_id"]
            isOneToOne: false
            referencedRelation: "mahallalar"
            referencedColumns: ["id"]
          },
        ]
      }
      mahallalar: {
        Row: {
          created_at: string
          id: string
          nomi: string
          rais_name: string | null
          sektor: string | null
          tuman: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nomi: string
          rais_name?: string | null
          sektor?: string | null
          tuman?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nomi?: string
          rais_name?: string | null
          sektor?: string | null
          tuman?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      password_otp: {
        Row: {
          attempts: number
          code_hash: string
          consumed: boolean
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed?: boolean
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          mahalla_id: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          mahalla_id?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          mahalla_id?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_mahalla_id_fkey"
            columns: ["mahalla_id"]
            isOneToOne: false
            referencedRelation: "mahallalar"
            referencedColumns: ["id"]
          },
        ]
      }
      token_ledger: {
        Row: {
          amount: number
          citizen_id: string
          created_at: string
          entry_type: Database["public"]["Enums"]["token_entry_type"]
          id: string
          mahalla_id: string | null
          performed_by: string | null
          reason: string
          rule_id: string | null
        }
        Insert: {
          amount: number
          citizen_id: string
          created_at?: string
          entry_type: Database["public"]["Enums"]["token_entry_type"]
          id?: string
          mahalla_id?: string | null
          performed_by?: string | null
          reason: string
          rule_id?: string | null
        }
        Update: {
          amount?: number
          citizen_id?: string
          created_at?: string
          entry_type?: Database["public"]["Enums"]["token_entry_type"]
          id?: string
          mahalla_id?: string | null
          performed_by?: string | null
          reason?: string
          rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_ledger_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_ledger_mahalla_id_fkey"
            columns: ["mahalla_id"]
            isOneToOne: false
            referencedRelation: "mahallalar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_ledger_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "token_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      token_rules: {
        Row: {
          action_key: string
          action_name: string
          created_at: string
          daily_limit: number
          id: string
          is_active: boolean
          token_amount: number
          updated_at: string
        }
        Insert: {
          action_key: string
          action_name: string
          created_at?: string
          daily_limit?: number
          id?: string
          is_active?: boolean
          token_amount: number
          updated_at?: string
        }
        Update: {
          action_key?: string
          action_name?: string
          created_at?: string
          daily_limit?: number
          id?: string
          is_active?: boolean
          token_amount?: number
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
      award_token: {
        Args: {
          _action_key: string
          _citizen_id: string
          _performed_by?: string
        }
        Returns: Json
      }
      current_mahalla_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      manual_token: {
        Args: { _amount: number; _citizen_id: string; _reason: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "rais" | "kotib"
      token_entry_type: "earn" | "spend" | "manual"
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
      app_role: ["admin", "moderator", "user", "rais", "kotib"],
      token_entry_type: ["earn", "spend", "manual"],
    },
  },
} as const
