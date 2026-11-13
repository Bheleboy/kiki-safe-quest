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
      app_settings: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      armour_kits: {
        Row: {
          child_id: string
          created_at: string | null
          earned_at: string | null
          id: string
          included_in_pass: boolean
          order_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          included_in_pass?: boolean
          order_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          included_in_pass?: boolean
          order_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "armour_kits_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "armour_kits_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "armour_kits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      bulk_code_batches: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          name: string
          notes: string | null
          organisation: string | null
          seats: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          name: string
          notes?: string | null
          organisation?: string | null
          seats: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          organisation?: string | null
          seats?: number
        }
        Relationships: []
      }
      bulk_codes: {
        Row: {
          batch_id: string
          code: string
          created_at: string | null
          id: string
          redeemed_at: string | null
          redeemed_by: string | null
        }
        Insert: {
          batch_id: string
          code: string
          created_at?: string | null
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Update: {
          batch_id?: string
          code?: string
          created_at?: string | null
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_codes_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "bulk_code_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_codes_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      delivery_profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          consent_at: string | null
          created_at: string | null
          delivery_method: string | null
          locker_code: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          recipient_name: string | null
          suburb: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          consent_at?: string | null
          created_at?: string | null
          delivery_method?: string | null
          locker_code?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          recipient_name?: string | null
          suburb?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          consent_at?: string | null
          created_at?: string | null
          delivery_method?: string | null
          locker_code?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          recipient_name?: string | null
          suburb?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      entitlements: {
        Row: {
          bulk_code_id: string | null
          created_at: string | null
          granted_at: string | null
          id: string
          kind: string
          order_id: string | null
          revoked_at: string | null
          source: string
          user_id: string
        }
        Insert: {
          bulk_code_id?: string | null
          created_at?: string | null
          granted_at?: string | null
          id?: string
          kind: string
          order_id?: string | null
          revoked_at?: string | null
          source: string
          user_id: string
        }
        Update: {
          bulk_code_id?: string | null
          created_at?: string | null
          granted_at?: string | null
          id?: string
          kind?: string
          order_id?: string | null
          revoked_at?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_bulk_code_id_fkey"
            columns: ["bulk_code_id"]
            isOneToOne: false
            referencedRelation: "bulk_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      login_challenges: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          device_hash: string
          email: string
          existing_session_id: string | null
          expires_at: string
          id: string
          last_sent_at: string
          purpose: string
          resend_count: number
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          device_hash: string
          email: string
          existing_session_id?: string | null
          expires_at: string
          id?: string
          last_sent_at?: string
          purpose?: string
          resend_count?: number
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          device_hash?: string
          email?: string
          existing_session_id?: string | null
          expires_at?: string
          id?: string
          last_sent_at?: string
          purpose?: string
          resend_count?: number
          user_id?: string
        }
        Relationships: []
      }
      login_throttle: {
        Row: {
          fail_count: number
          key: string
          lock_level: number
          locked_until: string | null
          updated_at: string
          window_start: string
        }
        Insert: {
          fail_count?: number
          key: string
          lock_level?: number
          locked_until?: string | null
          updated_at?: string
          window_start?: string
        }
        Update: {
          fail_count?: number
          key?: string
          lock_level?: number
          locked_until?: string | null
          updated_at?: string
          window_start?: string
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
      orders: {
        Row: {
          amount_cents: number
          child_id: string | null
          created_at: string | null
          currency: string
          extra_kit_child_ids: string[]
          id: string
          included_kit_child_id: string | null
          kind: string
          metadata: Json
          paid_at: string | null
          provider: string
          provider_checkout_id: string | null
          provider_payment_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          child_id?: string | null
          created_at?: string | null
          currency?: string
          extra_kit_child_ids?: string[]
          id?: string
          included_kit_child_id?: string | null
          kind: string
          metadata?: Json
          paid_at?: string | null
          provider?: string
          provider_checkout_id?: string | null
          provider_payment_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          child_id?: string | null
          created_at?: string | null
          currency?: string
          extra_kit_child_ids?: string[]
          id?: string
          included_kit_child_id?: string | null
          kind?: string
          metadata?: Json
          paid_at?: string | null
          provider?: string
          provider_checkout_id?: string | null
          provider_payment_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_included_kit_child_id_fkey"
            columns: ["included_kit_child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_pins: {
        Row: {
          failed_attempts: number
          lock_level: number
          locked_until: string | null
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          failed_attempts?: number
          lock_level?: number
          locked_until?: string | null
          pin_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          failed_attempts?: number
          lock_level?: number
          locked_until?: string | null
          pin_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      parent_surveys: {
        Row: {
          approved: boolean
          approved_at: string | null
          child_id: string | null
          child_more_aware: boolean | null
          created_at: string
          display_name: string | null
          easy_to_use: boolean | null
          feedback: string | null
          google_review_clicked: boolean | null
          helped_child: boolean | null
          id: string
          overall_rating: number | null
          reviewed_child_survey_id: string | null
          share_publicly: boolean
          stream_id: string | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          child_id?: string | null
          child_more_aware?: boolean | null
          created_at?: string
          display_name?: string | null
          easy_to_use?: boolean | null
          feedback?: string | null
          google_review_clicked?: boolean | null
          helped_child?: boolean | null
          id?: string
          overall_rating?: number | null
          reviewed_child_survey_id?: string | null
          share_publicly?: boolean
          stream_id?: string | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          child_id?: string | null
          child_more_aware?: boolean | null
          created_at?: string
          display_name?: string | null
          easy_to_use?: boolean | null
          feedback?: string | null
          google_review_clicked?: boolean | null
          helped_child?: boolean | null
          id?: string
          overall_rating?: number | null
          reviewed_child_survey_id?: string | null
          share_publicly?: boolean
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
      reset_requests: {
        Row: {
          created_at: string
          device_hash: string
          expires_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_hash: string
          expires_at: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_hash?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          email_hash: string | null
          event_type: string
          id: number
          ip: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          email_hash?: string | null
          event_type: string
          id?: number
          ip?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          email_hash?: string | null
          event_type?: string
          id?: number
          ip?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_flags: {
        Row: {
          password_reset_required: boolean
          reason: string | null
          set_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          password_reset_required?: boolean
          reason?: string | null
          set_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          password_reset_required?: boolean
          reason?: string | null
          set_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          purpose: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          purpose: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          purpose?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          courier: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_method: string | null
          id: string
          kit_id: string
          locker_code: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          recipient_name: string | null
          shipped_at: string | null
          status: string
          suburb: string | null
          tracking_url: string | null
          updated_at: string | null
          user_id: string
          waybill: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          courier?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          id?: string
          kit_id: string
          locker_code?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          recipient_name?: string | null
          shipped_at?: string | null
          status?: string
          suburb?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id: string
          waybill?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          courier?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          id?: string
          kit_id?: string
          locker_code?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          recipient_name?: string | null
          shipped_at?: string | null
          status?: string
          suburb?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id?: string
          waybill?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "armour_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      trusted_devices: {
        Row: {
          created_at: string
          device_hash: string
          id: string
          last_seen_at: string
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_hash: string
          id?: string
          last_seen_at?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_hash?: string
          id?: string
          last_seen_at?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_hash: string
          ip: string | null
          last_seen_at: string
          revoke_reason: string | null
          revoked_at: string | null
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_hash: string
          ip?: string | null
          last_seen_at?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_hash?: string
          ip?: string | null
          last_seen_at?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      warrior_points: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          lesson_id: string | null
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          points: number
          reason: string
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warrior_points_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warrior_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          id: string
          payload: Json | null
          provider: string
          received_at: string
          type: string | null
        }
        Insert: {
          id: string
          payload?: Json | null
          provider?: string
          received_at?: string
          type?: string | null
        }
        Update: {
          id?: string
          payload?: Json | null
          provider?: string
          received_at?: string
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_child_stats: { Args: never; Returns: Json }
      admin_course_stats: { Args: never; Returns: Json }
      admin_signup_trend: { Args: never; Returns: Json }
      admin_user_stats: { Args: never; Returns: Json }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      fulfill_warrior_pass_order: {
        Args: { _order_id: string; _payment_id: string }
        Returns: boolean
      }
      get_public_parent_reviews: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          feedback: string
          id: string
          overall_rating: number
        }[]
      }
      has_course_access: { Args: { _user_id: string }; Returns: boolean }
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
      revoke_auth_session: { Args: { _session_id: string }; Returns: undefined }
      session_is_registered: { Args: never; Returns: boolean }
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
