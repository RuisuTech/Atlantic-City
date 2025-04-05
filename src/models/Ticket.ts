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
  createdBy?: string; // UUID of the user who created the ticket
  updatedBy?: string; // UUID of the user who last updated the ticket
  updatedAt?: string; // ISO date string of the last update
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
      code: ticket.code || '',
      paymentMethod: ticket.payment_method as PaymentMethod,
      createdBy: ticket.created_by || undefined,
      updatedBy: ticket.updated_by || undefined,
      updatedAt: ticket.updated_at || undefined
    }));
  }

  static async addTicket(ticket: Omit<Ticket, "id" | "code">, userId?: string): Promise<Ticket | null> {
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
        code: uniqueCode,
        created_by: userId
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
      code: data.code || '',
      paymentMethod: data.payment_method as PaymentMethod,
      createdBy: data.created_by || undefined,
      updatedBy: data.updated_by || undefined,
      updatedAt: data.updated_at || undefined
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
      code: ticket.code || '',
      paymentMethod: ticket.payment_method as PaymentMethod,
      createdBy: ticket.created_by || undefined,
      updatedBy: ticket.updated_by || undefined,
      updatedAt: ticket.updated_at || undefined
    }));
  }

  static async getBalanceByClientId(clientId: number): Promise<number> {
    const tickets = await this.getTicketsByClientId(clientId);
    return tickets.reduce((balance, ticket) => {
      return balance + (ticket.type === "Deposit" ? ticket.amount : -ticket.amount);
    }, 0);
  }

  // Check if a withdrawal is allowed based on client balance
  static async isWithdrawalAllowed(clientId: number, amount: number): Promise<boolean> {
    const balance = await this.getBalanceByClientId(clientId);
    return balance >= amount;
  }

  // Function to update a ticket
  static async updateTicket(id: number, ticket: Partial<Omit<Ticket, "id">>, userId?: string): Promise<boolean> {
    const updateData: any = {};
    
    if (ticket.type) updateData.type = ticket.type;
    if (ticket.amount) updateData.amount = ticket.amount;
    if (ticket.date) updateData.date = ticket.date;
    if (ticket.paymentMethod) updateData.payment_method = ticket.paymentMethod;
    if (userId) updateData.updated_by = userId;
    
    const { error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error("Error updating ticket:", error);
      return false;
    }

    return true;
  }

  // Function to delete a ticket
  static async deleteTicket(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting ticket:", error);
      return false;
    }

    return true;
  }

  // Function to get today's tickets
  static async getTodayTickets(): Promise<Ticket[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .gte('date', today.toISOString())
      .order('date', { ascending: false });

    if (error) {
      console.error("Error fetching today's tickets:", error);
      return [];
    }

    return (data || []).map(ticket => ({
      id: ticket.id,
      clientId: ticket.client_id,
      type: ticket.type as TicketType,
      amount: Number(ticket.amount),
      date: ticket.date,
      code: ticket.code || '',
      paymentMethod: ticket.payment_method as PaymentMethod,
      createdBy: ticket.created_by || undefined,
      updatedBy: ticket.updated_by || undefined,
      updatedAt: ticket.updated_at || undefined
    }));
  }

  static async exportTicketsToCSV(onlyToday: boolean = false): Promise<string> {
    // Get tickets based on filter
    const tickets = onlyToday 
      ? await this.getTodayTickets() 
      : await this.getAllTickets();
    
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

      // Get creator name
      let creatorName = "Sistema";
      if (ticket.createdBy) {
        try {
          const { data } = await supabase
            .from('app_users')
            .select('username')
            .eq('id', ticket.createdBy);
          
          if (data && data.length > 0) creatorName = data[0].username;
        } catch (error) {
          console.error("Error fetching creator name:", error);
        }
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
                      ticket.paymentMethod === "card" ? "Tarjeta" : "Transferencia",
        createdBy: creatorName
      };
    }));

    // Create CSV header
    const headers = [
      "Código", "Fecha", "Hora", "Cliente", "ID Cliente", 
      "Tipo", "Monto", "Método de Pago", "Creado Por"
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
        `"${ticket.paymentMethod}"`,
        `"${ticket.createdBy}"`
      ];
      csvContent += row.join(",") + "\n";
    });
    
    return csvContent;
  }
}
