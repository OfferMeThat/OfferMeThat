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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      listings: {
        Row: {
          address: string
          createdAt: string
          createdBy: string
          id: string
          status: Database["public"]["Enums"]["listingStatus"]
        }
        Insert: {
          address: string
          createdAt?: string
          createdBy: string
          id?: string
          status: Database["public"]["Enums"]["listingStatus"]
        }
        Update: {
          address?: string
          createdAt?: string
          createdBy?: string
          id?: string
          status?: Database["public"]["Enums"]["listingStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "listings_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listingSellers: {
        Row: {
          createdAt: string
          email: string
          fullName: string
          id: string
          phone: string
          sendUpdateByEmail: boolean | null
        }
        Insert: {
          createdAt?: string
          email: string
          fullName: string
          id?: string
          phone: string
          sendUpdateByEmail?: boolean | null
        }
        Update: {
          createdAt?: string
          email?: string
          fullName?: string
          id?: string
          phone?: string
          sendUpdateByEmail?: boolean | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          amount: number
          buyerType: Database["public"]["Enums"]["buyerType"]
          conditional: boolean
          createdAt: string
          expires: string | null
          id: string
          listingId: string
          paymentWay: Database["public"]["Enums"]["paymentWays"]
          status: Database["public"]["Enums"]["offerStatus"]
        }
        Insert: {
          amount: number
          buyerType: Database["public"]["Enums"]["buyerType"]
          conditional?: boolean
          createdAt?: string
          expires?: string | null
          id?: string
          listingId: string
          paymentWay: Database["public"]["Enums"]["paymentWays"]
          status: Database["public"]["Enums"]["offerStatus"]
        }
        Update: {
          amount?: number
          buyerType?: Database["public"]["Enums"]["buyerType"]
          conditional?: boolean
          createdAt?: string
          expires?: string | null
          id?: string
          listingId?: string
          paymentWay?: Database["public"]["Enums"]["paymentWays"]
          status?: Database["public"]["Enums"]["offerStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "offers_listingId_fkey"
            columns: ["listingId"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatarUrl: string | null
          createdAt: string
          email: string
          fullName: string
          id: string
          username: string | null
        }
        Insert: {
          avatarUrl?: string | null
          createdAt?: string
          email: string
          fullName: string
          id?: string
          username?: string | null
        }
        Update: {
          avatarUrl?: string | null
          createdAt?: string
          email?: string
          fullName?: string
          id?: string
          username?: string | null
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
      buyerType: "buyer" | "agent" | "affiliate"
      listingStatus: "forSale" | "underContract" | "sold" | "withdrawn"
      offerStatus:
        | "pending"
        | "active"
        | "unverified"
        | "verified"
        | "accepted"
        | "rejected"
        | "expired"
        | "withdrawn"
        | "deleted"
      paymentWays: "cash" | "finance"
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
      buyerType: ["buyer", "agent", "affiliate"],
      listingStatus: ["forSale", "underContract", "sold", "withdrawn"],
      offerStatus: [
        "pending",
        "active",
        "unverified",
        "verified",
        "accepted",
        "rejected",
        "expired",
        "withdrawn",
        "deleted",
      ],
      paymentWays: ["cash", "finance"],
    },
  },
} as const
