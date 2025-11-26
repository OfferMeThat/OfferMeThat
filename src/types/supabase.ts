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
      offerFormPages: {
        Row: {
          breakIndex: number | null
          createdAt: string
          description: string | null
          formId: string
          id: string
          order: number
          title: string
        }
        Insert: {
          breakIndex?: number | null
          createdAt?: string
          description?: string | null
          formId: string
          id?: string
          order: number
          title: string
        }
        Update: {
          breakIndex?: number | null
          createdAt?: string
          description?: string | null
          formId?: string
          id?: string
          order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerFormPages_formId_fkey"
            columns: ["formId"]
            isOneToOne: false
            referencedRelation: "offerForms"
            referencedColumns: ["id"]
          },
        ]
      }
      offerFormQuestions: {
        Row: {
          createdAt: string
          formId: string
          id: string
          order: number
          pageId: string
          parentQuestionId: string | null
          payload: Json | null
          required: boolean
          type: Database["public"]["Enums"]["questionType"]
        }
        Insert: {
          createdAt?: string
          formId: string
          id?: string
          order: number
          pageId: string
          parentQuestionId?: string | null
          payload?: Json | null
          required: boolean
          type: Database["public"]["Enums"]["questionType"]
        }
        Update: {
          createdAt?: string
          formId?: string
          id?: string
          order?: number
          pageId?: string
          parentQuestionId?: string | null
          payload?: Json | null
          required?: boolean
          type?: Database["public"]["Enums"]["questionType"]
        }
        Relationships: [
          {
            foreignKeyName: "formQuestions_formId_fkey"
            columns: ["formId"]
            isOneToOne: false
            referencedRelation: "offerForms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formQuestions_parentQuestionId_fkey"
            columns: ["parentQuestionId"]
            isOneToOne: false
            referencedRelation: "offerFormQuestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerFormQuestions_pageId_fkey"
            columns: ["pageId"]
            isOneToOne: false
            referencedRelation: "offerFormPages"
            referencedColumns: ["id"]
          },
        ]
      }
      offerForms: {
        Row: {
          createdAt: string
          id: string
          ownerId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          ownerId: string
        }
        Update: {
          createdAt?: string
          id?: string
          ownerId?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      questionType:
        | "specifyListing"
        | "submitterName"
        | "submitterEmail"
        | "submitterPhone"
        | "offerAmount"
        | "submitButton"
        | "submitterRole"
        | "nameOfPurchaser"
        | "attachPurchaseAgreement"
        | "offerExpiry"
        | "deposit"
        | "subjectToLoanApproval"
        | "specialConditions"
        | "settlementDate"
        | "messageToAgent"
        | "custom"
        | "shortText"
        | "longText"
        | "provideAmount"
        | "uploadFiles"
        | "provideTime"
        | "yesNo"
        | "singleChoiceSelect"
        | "multiChoiceSelect"
        | "statement"
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
      questionType: [
        "specifyListing",
        "submitterName",
        "submitterEmail",
        "submitterPhone",
        "offerAmount",
        "submitButton",
        "submitterRole",
        "nameOfPurchaser",
        "attachPurchaseAgreement",
        "offerExpiry",
        "deposit",
        "subjectToLoanApproval",
        "specialConditions",
        "settlementDate",
        "messageToAgent",
        "custom",
        "shortText",
        "longText",
        "provideAmount",
        "uploadFiles",
        "provideTime",
        "yesNo",
        "singleChoiceSelect",
        "multiChoiceSelect",
        "statement",
      ],
    },
  },
} as const
