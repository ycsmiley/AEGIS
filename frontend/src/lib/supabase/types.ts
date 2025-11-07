export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          type: "BUYER" | "SUPPLIER";
          wallet_address: string | null;
          credit_rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: "BUYER" | "SUPPLIER";
          wallet_address?: string | null;
          credit_rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: "BUYER" | "SUPPLIER";
          wallet_address?: string | null;
          credit_rating?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          amount: number;
          currency: string;
          due_date: string;
          supplier_id: string;
          buyer_id: string;
          pdf_url: string | null;
          metadata: Json | null;
          status: "PENDING" | "APPROVED" | "FINANCED" | "REJECTED" | "PAID";
          aegis_payout_offer: number | null;
          aegis_discount_rate: number | null;
          aegis_signature: string | null;
          blockchain_tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          amount: number;
          currency?: string;
          due_date: string;
          supplier_id: string;
          buyer_id: string;
          pdf_url?: string | null;
          metadata?: Json | null;
          status?: "PENDING" | "APPROVED" | "FINANCED" | "REJECTED" | "PAID";
          aegis_payout_offer?: number | null;
          aegis_discount_rate?: number | null;
          aegis_signature?: string | null;
          blockchain_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          amount?: number;
          currency?: string;
          due_date?: string;
          supplier_id?: string;
          buyer_id?: string;
          pdf_url?: string | null;
          metadata?: Json | null;
          status?: "PENDING" | "APPROVED" | "FINANCED" | "REJECTED" | "PAID";
          aegis_payout_offer?: number | null;
          aegis_discount_rate?: number | null;
          aegis_signature?: string | null;
          blockchain_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          role: "BUYER" | "SUPPLIER" | "ADMIN" | "LP";
          company_id: string | null;
          wallet_address: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: "BUYER" | "SUPPLIER" | "ADMIN" | "LP";
          company_id?: string | null;
          wallet_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "BUYER" | "SUPPLIER" | "ADMIN" | "LP";
          company_id?: string | null;
          wallet_address?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

