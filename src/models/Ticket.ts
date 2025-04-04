
import { supabase } from "@/integrations/supabase/client";

export type TicketType = "Deposit" | "Withdrawal";
export type PaymentMethod = "cash" | "card" | "bank_transfer";

export interface Ticket {
  id: number;
  clientId: number;
  type: TicketType;
  amount: number;
  date: string; // ISO date string
  code: string;
  paymentMethod: PaymentMethod;
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

    return (data || []).map(ticket => ({
      id: ticket.id,
      clientId: ticket.client_id,
      type: ticket.type as TicketType,
      amount: Number(ticket.amount),
      date: ticket.date,
      code: ticket.code,
      paymentMethod: ticket.payment_method as PaymentMethod
    }));
  }

  static async addTicket(ticket: Omit<Ticket, "id" | "code">): Promise<Ticket | null> {
    // Generate a unique code (this is a backup, the database will also generate one if empty)
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const clientPart = ticket.clientId.toString().padStart(5, '0');
    const uniqueCode = `TICK-${clientPart}-${timestamp}-${randomPart}`;
    
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        client_id: ticket.clientId,
        type: ticket.type,
        amount: ticket.amount,
        date: ticket.date,
        payment_method: ticket.paymentMethod,
        code: uniqueCode
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding ticket:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      clientId: data.client_id,
      type: data.type as TicketType,
      amount: Number(data.amount),
      date: data.date,
      code: data.code,
      paymentMethod: data.payment_method as PaymentMethod
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

    return (data || []).map(ticket => ({
      id: ticket.id,
      clientId: ticket.client_id,
      type: ticket.type as TicketType,
      amount: Number(ticket.amount),
      date: ticket.date,
      code: ticket.code,
      paymentMethod: ticket.payment_method as PaymentMethod
    }));
  }

  static async getBalanceByClientId(clientId: number): Promise<number> {
    const tickets = await this.getTicketsByClientId(clientId);
    return tickets.reduce((balance, ticket) => {
      return balance + (ticket.type === "Deposit" ? ticket.amount : -ticket.amount);
    }, 0);
  }

  static async exportTicketsToCSV(): Promise<string> {
    const tickets = await this.getAllTickets();
    
    if (tickets.length === 0) {
      return "No tickets to export";
    }

    // Convert tickets to client-friendly format
    const formattedTickets = await Promise.all(tickets.map(async (ticket) => {
      // Get client name (optional enhancement)
      let clientName = "Unknown";
      try {
        const { data } = await supabase
          .from('clients')
          .select('name')
          .eq('id', ticket.clientId)
          .single();
        
        if (data) clientName = data.name;
      } catch (error) {
        console.error("Error fetching client name:", error);
      }

      return {
        code: ticket.code,
        date: new Date(ticket.date).toLocaleDateString('es-ES'),
        time: new Date(ticket.date).toLocaleTimeString('es-ES'),
        client: clientName,
        clientId: ticket.clientId,
        type: ticket.type === "Deposit" ? "Depósito" : "Retiro",
        amount: ticket.amount,
        paymentMethod: ticket.paymentMethod === "cash" ? "Efectivo" : 
                      ticket.paymentMethod === "card" ? "Tarjeta" : "Transferencia"
      };
    }));

    // Create CSV header
    const headers = [
      "Código", "Fecha", "Hora", "Cliente", "ID Cliente", 
      "Tipo", "Monto", "Método de Pago"
    ];
    
    // Create CSV content
    let csvContent = headers.join(",") + "\n";
    
    formattedTickets.forEach(ticket => {
      const row = [
        `"${ticket.code}"`,
        `"${ticket.date}"`,
        `"${ticket.time}"`,
        `"${ticket.client}"`,
        ticket.clientId,
        `"${ticket.type}"`,
        ticket.amount,
        `"${ticket.paymentMethod}"`
      ];
      csvContent += row.join(",") + "\n";
    });
    
    return csvContent;
  }
}
