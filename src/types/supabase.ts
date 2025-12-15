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
      leadFormPages: {
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
            foreignKeyName: "leadFormPages_formId_fkey"
            columns: ["formId"]
            isOneToOne: false
            referencedRelation: "leadForms"
            referencedColumns: ["id"]
          },
        ]
      }
      leadFormQuestions: {
        Row: {
          createdAt: string
          formId: string
          id: string
          order: number
          pageId: string | null
          required: boolean
          setupConfig: Json | null
          type: Database["public"]["Enums"]["questionType"]
          uiConfig: Json | null
        }
        Insert: {
          createdAt?: string
          formId: string
          id?: string
          order: number
          pageId?: string | null
          required?: boolean
          setupConfig?: Json | null
          type: Database["public"]["Enums"]["questionType"]
          uiConfig?: Json | null
        }
        Update: {
          createdAt?: string
          formId?: string
          id?: string
          order?: number
          pageId?: string | null
          required?: boolean
          setupConfig?: Json | null
          type?: Database["public"]["Enums"]["questionType"]
          uiConfig?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "leadFormQuestions_formId_fkey"
            columns: ["formId"]
            isOneToOne: false
            referencedRelation: "leadForms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadFormQuestions_pageId_fkey"
            columns: ["pageId"]
            isOneToOne: false
            referencedRelation: "leadFormPages"
            referencedColumns: ["id"]
          },
        ]
      }
      leadForms: {
        Row: {
          brandingConfig: Json | null
          createdAt: string
          id: string
          ownerId: string
        }
        Insert: {
          brandingConfig?: Json | null
          createdAt?: string
          id?: string
          ownerId: string
        }
        Update: {
          brandingConfig?: Json | null
          createdAt?: string
          id?: string
          ownerId?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadForms_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agentCompany: string | null
          areYouInterested:
            | Database["public"]["Enums"]["areYouInterested"]
            | null
          buyerAgentCompany: string | null
          buyerAgentEmail: string | null
          buyerAgentName: string | null
          createdAt: string
          customListingAddress: string | null
          customQuestionsData: Json | null
          financeInterest: Database["public"]["Enums"]["financeInterest"] | null
          followAllListings:
            | Database["public"]["Enums"]["followAllListings"]
            | null
          formData: Json | null
          formId: string | null
          id: string
          listingId: string | null
          messageToAgent: Json | null
          opinionOfSalePrice: string | null
          submitterEmail: string | null
          submitterFirstName: string | null
          submitterLastName: string | null
          submitterPhone: string | null
          submitterRole: Database["public"]["Enums"]["submitterRole"] | null
          termsAccepted: boolean | null
          updatedAt: string | null
        }
        Insert: {
          agentCompany?: string | null
          areYouInterested?:
            | Database["public"]["Enums"]["areYouInterested"]
            | null
          buyerAgentCompany?: string | null
          buyerAgentEmail?: string | null
          buyerAgentName?: string | null
          createdAt?: string
          customListingAddress?: string | null
          customQuestionsData?: Json | null
          financeInterest?:
            | Database["public"]["Enums"]["financeInterest"]
            | null
          followAllListings?:
            | Database["public"]["Enums"]["followAllListings"]
            | null
          formData?: Json | null
          formId?: string | null
          id?: string
          listingId?: string | null
          messageToAgent?: Json | null
          opinionOfSalePrice?: string | null
          submitterEmail?: string | null
          submitterFirstName?: string | null
          submitterLastName?: string | null
          submitterPhone?: string | null
          submitterRole?: Database["public"]["Enums"]["submitterRole"] | null
          termsAccepted?: boolean | null
          updatedAt?: string | null
        }
        Update: {
          agentCompany?: string | null
          areYouInterested?:
            | Database["public"]["Enums"]["areYouInterested"]
            | null
          buyerAgentCompany?: string | null
          buyerAgentEmail?: string | null
          buyerAgentName?: string | null
          createdAt?: string
          customListingAddress?: string | null
          customQuestionsData?: Json | null
          financeInterest?:
            | Database["public"]["Enums"]["financeInterest"]
            | null
          followAllListings?:
            | Database["public"]["Enums"]["followAllListings"]
            | null
          formData?: Json | null
          formId?: string | null
          id?: string
          listingId?: string | null
          messageToAgent?: Json | null
          opinionOfSalePrice?: string | null
          submitterEmail?: string | null
          submitterFirstName?: string | null
          submitterLastName?: string | null
          submitterPhone?: string | null
          submitterRole?: Database["public"]["Enums"]["submitterRole"] | null
          termsAccepted?: boolean | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_formId_fkey"
            columns: ["formId"]
            isOneToOne: false
            referencedRelation: "leadForms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_listingId_fkey"
            columns: ["listingId"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string
          createdAt: string
          createdBy: string
          id: string
          isTest: boolean | null
          status: Database["public"]["Enums"]["listingStatus"]
        }
        Insert: {
          address: string
          createdAt?: string
          createdBy: string
          id?: string
          isTest?: boolean | null
          status: Database["public"]["Enums"]["listingStatus"]
        }
        Update: {
          address?: string
          createdAt?: string
          createdBy?: string
          id?: string
          isTest?: boolean | null
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
          pageId: string | null
          required: boolean
          setupConfig: Json | null
          type: Database["public"]["Enums"]["questionType"]
          uiConfig: Json | null
        }
        Insert: {
          createdAt?: string
          formId: string
          id?: string
          order: number
          pageId?: string | null
          required: boolean
          setupConfig?: Json | null
          type: Database["public"]["Enums"]["questionType"]
          uiConfig?: Json | null
        }
        Update: {
          createdAt?: string
          formId?: string
          id?: string
          order?: number
          pageId?: string | null
          required?: boolean
          setupConfig?: Json | null
          type?: Database["public"]["Enums"]["questionType"]
          uiConfig?: Json | null
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
          brandingConfig: Json | null
          createdAt: string
          id: string
          ownerId: string
        }
        Insert: {
          brandingConfig?: Json | null
          createdAt?: string
          id?: string
          ownerId: string
        }
        Update: {
          brandingConfig?: Json | null
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
          customListingAddress: string | null
          customQuestionsData: Json | null
          depositData: Json | null
          expires: string | null
          expiryTime: string | null
          formData: Json | null
          formId: string | null
          id: string
          isTest: boolean | null
          listingId: string | null
          messageToAgent: Json | null
          paymentWay: Database["public"]["Enums"]["paymentWays"]
          purchaseAgreementFileUrl: string | null
          purchaserData: Json | null
          settlementDateData: Json | null
          specialConditions: string | null
          status: Database["public"]["Enums"]["offerStatus"]
          subjectToLoanApproval: Json | null
          submitterEmail: string | null
          submitterFirstName: string | null
          submitterLastName: string | null
          submitterPhone: string | null
          updatedAt: string | null
        }
        Insert: {
          amount: number
          buyerType: Database["public"]["Enums"]["buyerType"]
          conditional?: boolean
          createdAt?: string
          customListingAddress?: string | null
          customQuestionsData?: Json | null
          depositData?: Json | null
          expires?: string | null
          expiryTime?: string | null
          formData?: Json | null
          formId?: string | null
          id?: string
          isTest?: boolean | null
          listingId?: string | null
          messageToAgent?: Json | null
          paymentWay: Database["public"]["Enums"]["paymentWays"]
          purchaseAgreementFileUrl?: string | null
          purchaserData?: Json | null
          settlementDateData?: Json | null
          specialConditions?: string | null
          status: Database["public"]["Enums"]["offerStatus"]
          subjectToLoanApproval?: Json | null
          submitterEmail?: string | null
          submitterFirstName?: string | null
          submitterLastName?: string | null
          submitterPhone?: string | null
          updatedAt?: string | null
        }
        Update: {
          amount?: number
          buyerType?: Database["public"]["Enums"]["buyerType"]
          conditional?: boolean
          createdAt?: string
          customListingAddress?: string | null
          customQuestionsData?: Json | null
          depositData?: Json | null
          expires?: string | null
          expiryTime?: string | null
          formData?: Json | null
          formId?: string | null
          id?: string
          isTest?: boolean | null
          listingId?: string | null
          messageToAgent?: Json | null
          paymentWay?: Database["public"]["Enums"]["paymentWays"]
          purchaseAgreementFileUrl?: string | null
          purchaserData?: Json | null
          settlementDateData?: Json | null
          specialConditions?: string | null
          status?: Database["public"]["Enums"]["offerStatus"]
          subjectToLoanApproval?: Json | null
          submitterEmail?: string | null
          submitterFirstName?: string | null
          submitterLastName?: string | null
          submitterPhone?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_formId_fkey"
            columns: ["formId"]
            isOneToOne: false
            referencedRelation: "offerForms"
            referencedColumns: ["id"]
          },
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
      areYouInterested: "yesVeryInterested" | "yes" | "no" | "maybe"
      buyerType: "buyer" | "agent" | "affiliate"
      financeInterest: "yes" | "no"
      financeSetup: "referralPartner" | "selfManage"
      followAllListings: "thisAndFuture" | "thisOnly"
      listingStatus:
        | "forSale"
        | "underContract"
        | "sold"
        | "withdrawn"
        | "unassigned"
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
        | "unassigned"
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
        | "listingInterest"
        | "areYouInterested"
        | "followAllListings"
        | "opinionOfSalePrice"
        | "captureFinanceLeads"
        | "name"
        | "email"
        | "tel"
      submitterRole: "buyerSelf" | "buyerWithAgent" | "buyersAgent"
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
      areYouInterested: ["yesVeryInterested", "yes", "no", "maybe"],
      buyerType: ["buyer", "agent", "affiliate"],
      financeInterest: ["yes", "no"],
      financeSetup: ["referralPartner", "selfManage"],
      followAllListings: ["thisAndFuture", "thisOnly"],
      listingStatus: [
        "forSale",
        "underContract",
        "sold",
        "withdrawn",
        "unassigned",
      ],
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
        "unassigned",
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
        "listingInterest",
        "areYouInterested",
        "followAllListings",
        "opinionOfSalePrice",
        "captureFinanceLeads",
        "name",
        "email",
        "tel",
      ],
      submitterRole: ["buyerSelf", "buyerWithAgent", "buyersAgent"],
    },
  },
} as const
