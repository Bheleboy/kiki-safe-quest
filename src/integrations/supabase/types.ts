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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      armour_pieces: {
        Row: {
          child_id: string | null
          course_id: string
          earned_at: string
          id: string
          piece_id: string
          user_id: string
        }
        Insert: {
          child_id?: string | null
          course_id?: string
          earned_at?: string
          id?: string
          piece_id: string
          user_id: string
        }
        Update: {
          child_id?: string | null
          course_id?: string
          earned_at?: string
          id?: string
          piece_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "armour_pieces_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_id: string
          child_id: string | null
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          child_id?: string | null
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          child_id?: string | null
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      book_purchases: {
        Row: {
          book_id: string
          book_title: string
          id: string
          purchased_at: string
          store_name: string
          store_url: string
          user_id: string
        }
        Insert: {
          book_id: string
          book_title: string
          id?: string
          purchased_at?: string
          store_name: string
          store_url: string
          user_id: string
        }
        Update: {
          book_id?: string
          book_title?: string
          id?: string
          purchased_at?: string
          store_name?: string
          store_url?: string
          user_id?: string
        }
        Relationships: []
      }
      child_surveys: {
        Row: {
          age_band: string
          child_id: string
          created_at: string
          favorite_part: string | null
          id: string
          learned_something: boolean | null
          parent_approved: boolean | null
          parent_approved_at: string | null
          parent_notified: boolean | null
          stream_id: string
          user_id: string
          videos_helpful: boolean | null
          was_easy: boolean | null
          was_fun: boolean | null
          what_to_improve: string | null
          would_recommend: boolean | null
        }
        Insert: {
          age_band: string
          child_id: string
          created_at?: string
          favorite_part?: string | null
          id?: string
          learned_something?: boolean | null
          parent_approved?: boolean | null
          parent_approved_at?: string | null
          parent_notified?: boolean | null
          stream_id: string
          user_id: string
          videos_helpful?: boolean | null
          was_easy?: boolean | null
          was_fun?: boolean | null
          what_to_improve?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          age_band?: string
          child_id?: string
          created_at?: string
          favorite_part?: string | null
          id?: string
          learned_something?: boolean | null
          parent_approved?: boolean | null
          parent_approved_at?: string | null
          parent_notified?: boolean | null
          stream_id?: string
          user_id?: string
          videos_helpful?: boolean | null
          was_easy?: boolean | null
          was_fun?: boolean | null
          what_to_improve?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "child_surveys_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age_band: string
          avatar_color: string
          created_at: string
          first_name: string
          id: string
          parent_id: string
        }
        Insert: {
          age_band?: string
          avatar_color?: string
          created_at?: string
          first_name?: string
          id?: string
          parent_id: string
        }
        Update: {
          age_band?: string
          avatar_color?: string
          created_at?: string
          first_name?: string
          id?: string
          parent_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          child_id: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          child_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_surveys: {
        Row: {
          child_id: string | null
          child_more_aware: boolean | null
          created_at: string
          easy_to_use: boolean | null
          feedback: string | null
          google_review_clicked: boolean | null
          helped_child: boolean | null
          id: string
          overall_rating: number | null
          reviewed_child_survey_id: string | null
          stream_id: string | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          child_id?: string | null
          child_more_aware?: boolean | null
          created_at?: string
          easy_to_use?: boolean | null
          feedback?: string | null
          google_review_clicked?: boolean | null
          helped_child?: boolean | null
          id?: string
          overall_rating?: number | null
          reviewed_child_survey_id?: string | null
          stream_id?: string | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          child_id?: string | null
          child_more_aware?: boolean | null
          created_at?: string
          easy_to_use?: boolean | null
          feedback?: string | null
          google_review_clicked?: boolean | null
          helped_child?: boolean | null
          id?: string
          overall_rating?: number | null
          reviewed_child_survey_id?: string | null
          stream_id?: string | null
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_surveys_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_surveys_reviewed_child_survey_id_fkey"
            columns: ["reviewed_child_survey_id"]
            isOneToOne: false
            referencedRelation: "child_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_band: string
          age_verified: boolean
          age_verified_at: string | null
          consent_accepted_at: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          is_admin: boolean
        }
        Insert: {
          age_band?: string
          age_verified?: boolean
          age_verified_at?: string | null
          consent_accepted_at?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id: string
          is_admin?: boolean
        }
        Update: {
          age_band?: string
          age_verified?: boolean
          age_verified_at?: string | null
          consent_accepted_at?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_admin?: boolean
        }
        Relationships: []
      }
      progress: {
        Row: {
          child_id: string | null
          completed_at: string
          id: string
          lesson_id: string
          score: number
          time_spent_seconds: number
          user_id: string
        }
        Insert: {
          child_id?: string | null
          completed_at?: string
          id?: string
          lesson_id: string
          score?: number
          time_spent_seconds?: number
          user_id: string
        }
        Update: {
          child_id?: string | null
          completed_at?: string
          id?: string
          lesson_id?: string
          score?: number
          time_spent_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_parent_of_child: {
        Args: { _child_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
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
