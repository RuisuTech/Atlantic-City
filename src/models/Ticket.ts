
import { supabase } from "@/integrations/supabase/client";

export type TicketType = "Deposit" | "Withdrawal";

export interface Ticket {
  id: number;
  clientId: number;
  type: TicketType;
  amount: number;
  date: string; // ISO date string
}

export class TicketManager {
  static async getAllTickets(): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      return [];
    }

    return data.map(ticket => ({
      id: ticket.id,
      clientId: ticket.client_id,
      type: ticket.type as TicketType,
      amount: Number(ticket.amount),
      date: ticket.date
    }));
  }

  static async addTicket(ticket: Omit<Ticket, "id">): Promise<Ticket | null> {
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        client_id: ticket.clientId,
        type: ticket.type,
        amount: ticket.amount,
        date: ticket.date
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding ticket:", error);
      return null;
    }

    return {
      id: data.id,
      clientId: data.client_id,
      type: data.type as TicketType,
      amount: Number(data.amount),
      date: data.date
    };
  }

  static async getTicketsByClientId(clientId: number): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });

    if (error) {
      console.error("Error fetching client tickets:", error);
      return [];
    }

    return data.map(ticket => ({
      id: ticket.id,
      clientId: ticket.client_id,
      type: ticket.type as TicketType,
      amount: Number(ticket.amount),
      date: ticket.date
    }));
  }

  static async getBalanceByClientId(clientId: number): Promise<number> {
    const tickets = await this.getTicketsByClientId(clientId);
    return tickets.reduce((balance, ticket) => {
      return balance + (ticket.type === "Deposit" ? ticket.amount : -ticket.amount);
    }, 0);
  }
}
