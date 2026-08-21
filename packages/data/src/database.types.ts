export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account_auth_state: {
        Row: {
          base509_account_id: string
          providers: Json
          totp_verified: boolean
          updated_at: string
        }
        Insert: {
          base509_account_id: string
          providers?: Json
          totp_verified?: boolean
          updated_at?: string
        }
        Update: {
          base509_account_id?: string
          providers?: Json
          totp_verified?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_auth_state_base509_account_id_fkey"
            columns: ["base509_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_account_id: string | null
          actor_kind: Database["public"]["Enums"]["actor_kind"]
          after: Json | null
          before: Json | null
          business_id: string | null
          correlation_id: string | null
          created_at: string
          id: string
          reason: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_account_id?: string | null
          actor_kind?: Database["public"]["Enums"]["actor_kind"]
          after?: Json | null
          before?: Json | null
          business_id?: string | null
          correlation_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_account_id?: string | null
          actor_kind?: Database["public"]["Enums"]["actor_kind"]
          after?: Json | null
          before?: Json | null
          business_id?: string | null
          correlation_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_account_id_fkey"
            columns: ["actor_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
          {
            foreignKeyName: "audit_events_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_identities: {
        Row: {
          base509_account_id: string
          created_at: string
          id: string
          issuer: string
          provider: string
          provider_subject: string
        }
        Insert: {
          base509_account_id: string
          created_at?: string
          id?: string
          issuer: string
          provider?: string
          provider_subject: string
        }
        Update: {
          base509_account_id?: string
          created_at?: string
          id?: string
          issuer?: string
          provider?: string
          provider_subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_identities_base509_account_id_fkey"
            columns: ["base509_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
        ]
      }
      availability_conflict_groups: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
          overlap_policy: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
          overlap_policy?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          overlap_policy?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_conflict_groups_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      base509_accounts: {
        Row: {
          base509_account_id: string
          created_at: string
          display_name: string | null
          primary_email: string | null
          status: string
          updated_at: string
        }
        Insert: {
          base509_account_id?: string
          created_at?: string
          display_name?: string | null
          primary_email?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          base509_account_id?: string
          created_at?: string
          display_name?: string | null
          primary_email?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_occurrences: {
        Row: {
          booking_id: string
          business_id: string
          business_service_id: string
          created_at: string
          id: string
          pet_count: number
          service_date: string
          service_window_id: string | null
          service_zone_id: string | null
          status: string
          unit_kind: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          business_id: string
          business_service_id: string
          created_at?: string
          id?: string
          pet_count?: number
          service_date: string
          service_window_id?: string | null
          service_zone_id?: string | null
          status?: string
          unit_kind: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          business_id?: string
          business_service_id?: string
          created_at?: string
          id?: string
          pet_count?: number
          service_date?: string
          service_window_id?: string | null
          service_zone_id?: string | null
          status?: string
          unit_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_occurrences_business_id_booking_id_fkey"
            columns: ["business_id", "booking_id"]
            referencedRelation: "bookings"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "booking_occurrences_business_id_business_service_id_fkey"
            columns: ["business_id", "business_service_id"]
            referencedRelation: "business_services"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "booking_occurrences_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_occurrences_business_id_service_window_id_fkey"
            columns: ["business_id", "service_window_id"]
            referencedRelation: "service_windows"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "booking_occurrences_business_id_service_zone_id_fkey"
            columns: ["business_id", "service_zone_id"]
            referencedRelation: "service_zones"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      booking_pets: {
        Row: {
          booking_id: string
          business_id: string
          created_at: string
          id: string
          pet_id: string
        }
        Insert: {
          booking_id: string
          business_id: string
          created_at?: string
          id?: string
          pet_id: string
        }
        Update: {
          booking_id?: string
          business_id?: string
          created_at?: string
          id?: string
          pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_pets_business_id_booking_id_fkey"
            columns: ["business_id", "booking_id"]
            referencedRelation: "bookings"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "booking_pets_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_pets_business_id_pet_id_fkey"
            columns: ["business_id", "pet_id"]
            referencedRelation: "pets"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      bookings: {
        Row: {
          business_id: string
          business_service_id: string
          client_id: string
          created_at: string
          created_by_account_id: string | null
          end_date: string | null
          id: string
          over_capacity_ack: boolean
          over_capacity_reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          business_service_id: string
          client_id: string
          created_at?: string
          created_by_account_id?: string | null
          end_date?: string | null
          id?: string
          over_capacity_ack?: boolean
          over_capacity_reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          business_service_id?: string
          client_id?: string
          created_at?: string
          created_by_account_id?: string | null
          end_date?: string | null
          id?: string
          over_capacity_ack?: boolean
          over_capacity_reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_business_service_id_fkey"
            columns: ["business_id", "business_service_id"]
            referencedRelation: "business_services"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "bookings_business_id_client_id_fkey"
            columns: ["business_id", "client_id"]
            referencedRelation: "clients"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
        ]
      }
      business_calendar_days: {
        Row: {
          all_services_blocked: boolean
          business_id: string
          created_at: string
          created_by_account_id: string | null
          holiday_pricing: string | null
          id: string
          note: string | null
          service_date: string
          updated_at: string
        }
        Insert: {
          all_services_blocked?: boolean
          business_id: string
          created_at?: string
          created_by_account_id?: string | null
          holiday_pricing?: string | null
          id?: string
          note?: string | null
          service_date: string
          updated_at?: string
        }
        Update: {
          all_services_blocked?: boolean
          business_id?: string
          created_at?: string
          created_by_account_id?: string | null
          holiday_pricing?: string | null
          id?: string
          note?: string | null
          service_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_calendar_days_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_calendar_days_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
        ]
      }
      business_entitlements: {
        Row: {
          business_id: string
          capabilities: Json
          client_limit: number | null
          created_at: string
          effective_at: string
          expires_at: string | null
          id: string
          last_synced_at: string
          projection_version: number
          seat_limit: number | null
          source_system: string
          source_version: number
          sync_status: string
          theme_allowlist: Json
          tier_key: string
          updated_at: string
        }
        Insert: {
          business_id: string
          capabilities?: Json
          client_limit?: number | null
          created_at?: string
          effective_at?: string
          expires_at?: string | null
          id?: string
          last_synced_at?: string
          projection_version?: number
          seat_limit?: number | null
          source_system: string
          source_version?: number
          sync_status?: string
          theme_allowlist?: Json
          tier_key: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          capabilities?: Json
          client_limit?: number | null
          created_at?: string
          effective_at?: string
          expires_at?: string | null
          id?: string
          last_synced_at?: string
          projection_version?: number
          seat_limit?: number | null
          source_system?: string
          source_version?: number
          sync_status?: string
          theme_allowlist?: Json
          tier_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_entitlements_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_invite_codes: {
        Row: {
          business_id: string
          code_hash: string
          created_at: string
          created_by_account_id: string
          display_prefix: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          revoked_at: string | null
          target_role: Database["public"]["Enums"]["membership_role"] | null
          type: string
          uses_count: number
        }
        Insert: {
          business_id: string
          code_hash: string
          created_at?: string
          created_by_account_id: string
          display_prefix?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          revoked_at?: string | null
          target_role?: Database["public"]["Enums"]["membership_role"] | null
          type: string
          uses_count?: number
        }
        Update: {
          business_id?: string
          code_hash?: string
          created_at?: string
          created_by_account_id?: string
          display_prefix?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          revoked_at?: string | null
          target_role?: Database["public"]["Enums"]["membership_role"] | null
          type?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_invite_codes_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invite_codes_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
        ]
      }
      business_memberships: {
        Row: {
          base509_account_id: string
          business_id: string
          created_at: string
          id: string
          invited_by_account_id: string | null
          role: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
        }
        Insert: {
          base509_account_id: string
          business_id: string
          created_at?: string
          id?: string
          invited_by_account_id?: string | null
          role: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Update: {
          base509_account_id?: string
          business_id?: string
          created_at?: string
          id?: string
          invited_by_account_id?: string | null
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_memberships_base509_account_id_fkey"
            columns: ["base509_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
          {
            foreignKeyName: "business_memberships_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_memberships_invited_by_account_id_fkey"
            columns: ["invited_by_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
        ]
      }
      business_service_day_overrides: {
        Row: {
          business_id: string
          business_service_id: string
          created_at: string
          created_by_account_id: string | null
          id: string
          is_available: boolean | null
          service_date: string
          service_limit_override: number | null
          updated_at: string
        }
        Insert: {
          business_id: string
          business_service_id: string
          created_at?: string
          created_by_account_id?: string | null
          id?: string
          is_available?: boolean | null
          service_date: string
          service_limit_override?: number | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          business_service_id?: string
          created_at?: string
          created_by_account_id?: string | null
          id?: string
          is_available?: boolean | null
          service_date?: string
          service_limit_override?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_service_day_override_business_id_business_service_fkey"
            columns: ["business_id", "business_service_id"]
            referencedRelation: "business_services"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "business_service_day_overrides_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_service_day_overrides_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
        ]
      }
      business_service_zones: {
        Row: {
          business_id: string
          business_service_id: string
          created_at: string
          id: string
          service_zone_id: string
        }
        Insert: {
          business_id: string
          business_service_id: string
          created_at?: string
          id?: string
          service_zone_id: string
        }
        Update: {
          business_id?: string
          business_service_id?: string
          created_at?: string
          id?: string
          service_zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_service_zones_business_id_business_service_id_fkey"
            columns: ["business_id", "business_service_id"]
            referencedRelation: "business_services"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "business_service_zones_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_service_zones_business_id_service_zone_id_fkey"
            columns: ["business_id", "service_zone_id"]
            referencedRelation: "service_zones"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      business_services: {
        Row: {
          business_id: string
          capacity_config: Json
          capacity_group_id: string | null
          capacity_model: string
          conflict_group_id: string | null
          created_at: string
          duration_config: Json
          duration_model: string
          enabled: boolean
          id: string
          name: string
          service_type_key: string
          updated_at: string
          visibility: string
        }
        Insert: {
          business_id: string
          capacity_config?: Json
          capacity_group_id?: string | null
          capacity_model: string
          conflict_group_id?: string | null
          created_at?: string
          duration_config?: Json
          duration_model: string
          enabled?: boolean
          id?: string
          name: string
          service_type_key: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          business_id?: string
          capacity_config?: Json
          capacity_group_id?: string | null
          capacity_model?: string
          conflict_group_id?: string | null
          created_at?: string
          duration_config?: Json
          duration_model?: string
          enabled?: boolean
          id?: string
          name?: string
          service_type_key?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_services_business_id_capacity_group_id_fkey"
            columns: ["business_id", "capacity_group_id"]
            referencedRelation: "capacity_groups"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "business_services_business_id_conflict_group_id_fkey"
            columns: ["business_id", "conflict_group_id"]
            referencedRelation: "availability_conflict_groups"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "business_services_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          bootstrap_key: string | null
          created_at: string
          currency: string
          id: string
          name: string
          owner_account_id: string
          settings: Json
          slug: string | null
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          bootstrap_key?: string | null
          created_at?: string
          currency?: string
          id?: string
          name: string
          owner_account_id: string
          settings?: Json
          slug?: string | null
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          bootstrap_key?: string | null
          created_at?: string
          currency?: string
          id?: string
          name?: string
          owner_account_id?: string
          settings?: Json
          slug?: string | null
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_account_id_fkey"
            columns: ["owner_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
        ]
      }
      capacity_group_day_overrides: {
        Row: {
          business_id: string
          capacity_group_id: string
          created_at: string
          created_by_account_id: string | null
          id: string
          pool_limit_override: number
          service_date: string
          updated_at: string
        }
        Insert: {
          business_id: string
          capacity_group_id: string
          created_at?: string
          created_by_account_id?: string | null
          id?: string
          pool_limit_override: number
          service_date: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          capacity_group_id?: string
          created_at?: string
          created_by_account_id?: string | null
          id?: string
          pool_limit_override?: number
          service_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capacity_group_day_overrides_business_id_capacity_group_id_fkey"
            columns: ["business_id", "capacity_group_id"]
            referencedRelation: "capacity_groups"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "capacity_group_day_overrides_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capacity_group_day_overrides_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
        ]
      }
      capacity_groups: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
          pool_limit: number
          resource_unit: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
          pool_limit: number
          resource_unit: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          pool_limit?: number
          resource_unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capacity_groups_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          base509_account_id: string | null
          blocked_by_account_id: string | null
          blocked_reason: string | null
          business_id: string
          created_at: string
          display_name: string
          emergency_contact: Json | null
          ended_at: string | null
          id: string
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          vet_info: Json | null
        }
        Insert: {
          base509_account_id?: string | null
          blocked_by_account_id?: string | null
          blocked_reason?: string | null
          business_id: string
          created_at?: string
          display_name: string
          emergency_contact?: Json | null
          ended_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          vet_info?: Json | null
        }
        Update: {
          base509_account_id?: string | null
          blocked_by_account_id?: string | null
          blocked_reason?: string | null
          business_id?: string
          created_at?: string
          display_name?: string
          emergency_contact?: Json | null
          ended_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          vet_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_base509_account_id_fkey"
            columns: ["base509_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
          {
            foreignKeyName: "clients_blocked_by_account_id_fkey"
            columns: ["blocked_by_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlement_sync_receipts: {
        Row: {
          business_id: string
          event_id: string
          id: string
          outcome: string
          received_at: string
          source_system: string
          source_version: number
        }
        Insert: {
          business_id: string
          event_id: string
          id?: string
          outcome: string
          received_at?: string
          source_system: string
          source_version: number
        }
        Update: {
          business_id?: string
          event_id?: string
          id?: string
          outcome?: string
          received_at?: string
          source_system?: string
          source_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "entitlement_sync_receipts_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          breed: string | null
          business_id: string
          care_notes: string | null
          client_id: string
          created_at: string
          dob: string | null
          id: string
          name: string
          photo_path: string | null
          species: string | null
          status: string
          updated_at: string
        }
        Insert: {
          breed?: string | null
          business_id: string
          care_notes?: string | null
          client_id: string
          created_at?: string
          dob?: string | null
          id?: string
          name: string
          photo_path?: string | null
          species?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          breed?: string | null
          business_id?: string
          care_notes?: string | null
          client_id?: string
          created_at?: string
          dob?: string | null
          id?: string
          name?: string
          photo_path?: string | null
          species?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_business_id_client_id_fkey"
            columns: ["business_id", "client_id"]
            referencedRelation: "clients"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "pets_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_member_capacity_defaults: {
        Row: {
          business_id: string
          business_membership_id: string
          business_service_id: string
          capacity: number
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          business_membership_id: string
          business_service_id: string
          capacity: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          business_membership_id?: string
          business_service_id?: string
          capacity?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_member_capacity_defau_business_id_business_members_fkey"
            columns: ["business_id", "business_membership_id"]
            referencedRelation: "business_memberships"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "service_member_capacity_defau_business_id_business_service_fkey"
            columns: ["business_id", "business_service_id"]
            referencedRelation: "business_services"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "service_member_capacity_defaults_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_window_assignment_zones: {
        Row: {
          business_id: string
          created_at: string
          id: string
          service_window_assignment_id: string
          service_zone_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          service_window_assignment_id: string
          service_zone_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          service_window_assignment_id?: string
          service_zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_window_assignment_zon_business_id_service_window_a_fkey"
            columns: ["business_id", "service_window_assignment_id"]
            referencedRelation: "service_window_assignments"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "service_window_assignment_zone_business_id_service_zone_id_fkey"
            columns: ["business_id", "service_zone_id"]
            referencedRelation: "service_zones"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "service_window_assignment_zones_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_window_assignments: {
        Row: {
          business_id: string
          business_membership_id: string
          created_at: string
          id: string
          member_capacity_override: number | null
          service_window_id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          business_membership_id: string
          created_at?: string
          id?: string
          member_capacity_override?: number | null
          service_window_id: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          business_membership_id?: string
          created_at?: string
          id?: string
          member_capacity_override?: number | null
          service_window_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_window_assignments_business_id_business_membership_fkey"
            columns: ["business_id", "business_membership_id"]
            referencedRelation: "business_memberships"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "service_window_assignments_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_window_assignments_business_id_service_window_id_fkey"
            columns: ["business_id", "service_window_id"]
            referencedRelation: "service_windows"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      service_window_day_override_assignment_zones: {
        Row: {
          business_id: string
          created_at: string
          id: string
          service_window_day_override_assignment_id: string
          service_zone_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          service_window_day_override_assignment_id: string
          service_zone_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          service_window_day_override_assignment_id?: string
          service_zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_window_day_override__business_id_service_window_d_fkey1"
            columns: [
              "business_id",
              "service_window_day_override_assignment_id",
            ]
            referencedRelation: "service_window_day_override_assignments"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "service_window_day_override_as_business_id_service_zone_id_fkey"
            columns: ["business_id", "service_zone_id"]
            referencedRelation: "service_zones"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "service_window_day_override_assignment_zones_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_window_day_override_assignments: {
        Row: {
          business_id: string
          business_membership_id: string
          created_at: string
          id: string
          member_capacity_override: number | null
          service_window_day_override_id: string
        }
        Insert: {
          business_id: string
          business_membership_id: string
          created_at?: string
          id?: string
          member_capacity_override?: number | null
          service_window_day_override_id: string
        }
        Update: {
          business_id?: string
          business_membership_id?: string
          created_at?: string
          id?: string
          member_capacity_override?: number | null
          service_window_day_override_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_window_day_override_a_business_id_business_members_fkey"
            columns: ["business_id", "business_membership_id"]
            referencedRelation: "business_memberships"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "service_window_day_override_a_business_id_service_window_d_fkey"
            columns: ["business_id", "service_window_day_override_id"]
            referencedRelation: "service_window_day_overrides"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "service_window_day_override_assignments_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_window_day_overrides: {
        Row: {
          business_id: string
          created_at: string
          created_by_account_id: string | null
          id: string
          is_available: boolean
          service_date: string
          service_window_id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by_account_id?: string | null
          id?: string
          is_available?: boolean
          service_date: string
          service_window_id: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by_account_id?: string | null
          id?: string
          is_available?: boolean
          service_date?: string
          service_window_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_window_day_overrides_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_window_day_overrides_business_id_service_window_id_fkey"
            columns: ["business_id", "service_window_id"]
            referencedRelation: "service_windows"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "service_window_day_overrides_created_by_account_id_fkey"
            columns: ["created_by_account_id"]
            referencedRelation: "base509_accounts"
            referencedColumns: ["base509_account_id"]
          },
        ]
      }
      service_window_zones: {
        Row: {
          business_id: string
          created_at: string
          id: string
          service_window_id: string
          service_zone_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          service_window_id: string
          service_zone_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          service_window_id?: string
          service_zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_window_zones_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_window_zones_business_id_service_window_id_fkey"
            columns: ["business_id", "service_window_id"]
            referencedRelation: "service_windows"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "service_window_zones_business_id_service_zone_id_fkey"
            columns: ["business_id", "service_zone_id"]
            referencedRelation: "service_zones"
            referencedColumns: ["business_id", "id"]
          },
        ]
      }
      service_windows: {
        Row: {
          business_id: string
          business_service_id: string
          created_at: string
          enabled: boolean
          end_time: string
          id: string
          name: string
          start_time: string
          updated_at: string
          weekdays: number[]
        }
        Insert: {
          business_id: string
          business_service_id: string
          created_at?: string
          enabled?: boolean
          end_time: string
          id?: string
          name: string
          start_time: string
          updated_at?: string
          weekdays?: number[]
        }
        Update: {
          business_id?: string
          business_service_id?: string
          created_at?: string
          enabled?: boolean
          end_time?: string
          id?: string
          name?: string
          start_time?: string
          updated_at?: string
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "service_windows_business_id_business_service_id_fkey"
            columns: ["business_id", "business_service_id"]
            referencedRelation: "business_services"
            referencedColumns: ["business_id", "id"]
          },
          {
            foreignKeyName: "service_windows_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_zones: {
        Row: {
          boundary: Json
          business_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          boundary: Json
          business_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          boundary?: Json
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_zones_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_account: { Args: never; Returns: string }
      change_membership_role: {
        Args: {
          p_business_id: string
          p_membership_id: string
          p_new_role: Database["public"]["Enums"]["membership_role"]
        }
        Returns: undefined
      }
      create_business: {
        Args: {
          p_currency?: string
          p_idempotency_key: string
          p_name: string
          p_timezone?: string
        }
        Returns: string
      }
      create_client: {
        Args: {
          p_business_id: string
          p_display_name: string
          p_emergency_contact?: Json
          p_vet_info?: Json
        }
        Returns: string
      }
      create_invite: {
        Args: {
          p_business_id: string
          p_expires_at?: string
          p_max_uses?: number
          p_target_role?: Database["public"]["Enums"]["membership_role"]
          p_type: string
        }
        Returns: {
          invite_id: string
          token: string
        }[]
      }
      effective_availability: {
        Args: {
          p_business_id: string
          p_business_service_id: string
          p_end_date: string
          p_pet_count?: number
          p_service_window_id?: string
          p_service_zone_id?: string
          p_start_date: string
        }
        Returns: {
          available: boolean
          service_date: string
        }[]
      }
      get_effective_entitlements: {
        Args: { p_business_id: string }
        Returns: Json
      }
      reactivate_client: {
        Args: { p_business_id: string; p_client_id: string }
        Returns: undefined
      }
      reactivate_member: {
        Args: { p_business_id: string; p_membership_id: string }
        Returns: undefined
      }
      redeem_invite: {
        Args: { p_token: string }
        Returns: {
          business_id: string
          relationship: string
          relationship_id: string
        }[]
      }
      remove_member: {
        Args: { p_business_id: string; p_membership_id: string }
        Returns: undefined
      }
      reset_day_override: {
        Args: {
          p_business_id: string
          p_kind: string
          p_service_date: string
          p_target_id: string
        }
        Returns: undefined
      }
      revoke_invite: {
        Args: { p_business_id: string; p_invite_id: string }
        Returns: undefined
      }
      set_business_theme: {
        Args: {
          p_business_id: string
          p_theme_key: string
          p_theme_mode: string
        }
        Returns: undefined
      }
      set_calendar_day: {
        Args: {
          p_all_services_blocked: boolean
          p_business_id: string
          p_holiday_pricing?: string
          p_note?: string
          p_service_date: string
        }
        Returns: string
      }
      set_client_status: {
        Args: {
          p_business_id: string
          p_client_id: string
          p_reason?: string
          p_status: Database["public"]["Enums"]["client_status"]
        }
        Returns: undefined
      }
      set_occurrence_care_status: {
        Args: {
          p_business_id: string
          p_occurrence_id: string
          p_status: string
        }
        Returns: undefined
      }
      set_pool_day_override: {
        Args: {
          p_business_id: string
          p_capacity_group_id: string
          p_pool_limit_override: number
          p_service_date: string
        }
        Returns: string
      }
      set_service_day_override: {
        Args: {
          p_business_id: string
          p_business_service_id: string
          p_is_available?: boolean
          p_service_date: string
          p_service_limit_override?: number
        }
        Returns: string
      }
      set_window_day_override: {
        Args: {
          p_assignments?: Json
          p_business_id: string
          p_is_available: boolean
          p_service_date: string
          p_service_window_id: string
        }
        Returns: string
      }
      sync_entitlements: {
        Args: { p_envelope: Json }
        Returns: {
          applied_version: number
          status: string
        }[]
      }
      sync_identity_audit: { Args: never; Returns: Json }
      team_directory: {
        Args: { p_business_id: string }
        Returns: {
          base509_account_id: string
          display_name: string
          membership_id: string
          primary_email: string
          role: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["membership_status"]
        }[]
      }
    }
    Enums: {
      actor_kind: "user" | "system" | "bootstrap"
      client_status: "active" | "blocked" | "ended"
      membership_role: "owner" | "admin" | "manager" | "staff"
      membership_status: "active" | "invited" | "removed"
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
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
    Enums: {
      actor_kind: ["user", "system", "bootstrap"],
      client_status: ["active", "blocked", "ended"],
      membership_role: ["owner", "admin", "manager", "staff"],
      membership_status: ["active", "invited", "removed"],
    },
  },
} as const

