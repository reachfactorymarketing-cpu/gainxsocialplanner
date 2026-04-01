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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: string | null
          author_id: string | null
          body: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          audience?: string | null
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          audience?: string | null
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      brainstorm_notes: {
        Row: {
          author_id: string | null
          body: string
          color: string
          created_at: string
          id: string
          title: string
          zone: string
        }
        Insert: {
          author_id?: string | null
          body?: string
          color?: string
          created_at?: string
          id?: string
          title?: string
          zone?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          color?: string
          created_at?: string
          id?: string
          title?: string
          zone?: string
        }
        Relationships: []
      }
      document_comments: {
        Row: {
          author_id: string | null
          created_at: string
          document_id: string
          id: string
          text: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          document_id: string
          id?: string
          text: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          document_id?: string
          id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          document_id: string
          id: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          document_id: string
          id?: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          folder: string
          id: string
          permissions_level: string
          pinned: boolean
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          folder?: string
          id?: string
          permissions_level?: string
          pinned?: boolean
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          folder?: string
          id?: string
          permissions_level?: string
          pinned?: boolean
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel: string
          created_at: string
          id: string
          sender_id: string | null
          text: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          text: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          text?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          screen: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          screen?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          screen?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          has_seen_welcome: boolean
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
          zone: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          has_seen_welcome?: boolean
          id: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
          zone?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          has_seen_welcome?: boolean
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      revenue: {
        Row: {
          donations: number
          fifty_fifty_income: number
          id: string
          raffle_income: number
          sponsor_income: number
          ticket_sales: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          donations?: number
          fifty_fifty_income?: number
          id?: string
          raffle_income?: number
          sponsor_income?: number
          ticket_sales?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          donations?: number
          fifty_fifty_income?: number
          id?: string
          raffle_income?: number
          sponsor_income?: number
          ticket_sales?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      schedule_slots: {
        Row: {
          activity: string
          created_at: string
          end_time: string | null
          id: string
          location: string | null
          notes: string | null
          phase: Database["public"]["Enums"]["schedule_phase"]
          roles: string[] | null
          time: string
          updated_at: string
          zone: string
        }
        Insert: {
          activity: string
          created_at?: string
          end_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          phase?: Database["public"]["Enums"]["schedule_phase"]
          roles?: string[] | null
          time: string
          updated_at?: string
          zone?: string
        }
        Update: {
          activity?: string
          created_at?: string
          end_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          phase?: Database["public"]["Enums"]["schedule_phase"]
          roles?: string[] | null
          time?: string
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      task_checklist_items: {
        Row: {
          done: boolean
          id: string
          position: number
          task_id: string
          text: string
        }
        Insert: {
          done?: boolean
          id?: string
          position?: number
          task_id: string
          text: string
        }
        Update: {
          done?: boolean
          id?: string
          position?: number
          task_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          task_id: string
          text: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          task_id: string
          text: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          task_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          zone: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          zone?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      transfer_log: {
        Row: {
          from_user_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tasks_transferred: string[] | null
          to_user_id: string | null
          transferred_at: string
        }
        Insert: {
          from_user_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tasks_transferred?: string[] | null
          to_user_id?: string | null
          transferred_at?: string
        }
        Update: {
          from_user_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tasks_transferred?: string[] | null
          to_user_id?: string | null
          transferred_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          agreement_status: string | null
          booth_location: string | null
          category: string | null
          created_at: string
          freebie_status: string | null
          id: string
          load_in_time: string | null
          name: string
          notes: string | null
          raffle_status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agreement_status?: string | null
          booth_location?: string | null
          category?: string | null
          created_at?: string
          freebie_status?: string | null
          id?: string
          load_in_time?: string | null
          name: string
          notes?: string | null
          raffle_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agreement_status?: string | null
          booth_location?: string | null
          category?: string | null
          created_at?: string
          freebie_status?: string | null
          id?: string
          load_in_time?: string | null
          name?: string
          notes?: string | null
          raffle_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_zone: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "zone_lead"
        | "volunteer"
        | "instructor"
        | "vendor"
        | "reset_space_partner"
      schedule_phase: "setup" | "event" | "breakdown"
      task_priority: "low" | "medium" | "high"
      task_status: "To Do" | "In Progress" | "Needs Review" | "Done"
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
      app_role: [
        "admin",
        "zone_lead",
        "volunteer",
        "instructor",
        "vendor",
        "reset_space_partner",
      ],
      schedule_phase: ["setup", "event", "breakdown"],
      task_priority: ["low", "medium", "high"],
      task_status: ["To Do", "In Progress", "Needs Review", "Done"],
    },
  },
} as const
