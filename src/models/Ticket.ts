
export type TicketType = "Deposit" | "Withdrawal";

export interface Ticket {
  id: number;
  clientId: number;
  type: TicketType;
  amount: number;
  date: string; // ISO date string
}

export class TicketManager {
  private static localStorageKey = "casino-tickets";

  static getAllTickets(): Ticket[] {
    const ticketsJson = localStorage.getItem(this.localStorageKey);
    return ticketsJson ? JSON.parse(ticketsJson) : [];
  }

  static saveTickets(tickets: Ticket[]): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(tickets));
  }

  static addTicket(ticket: Omit<Ticket, "id">): Ticket {
    const tickets = this.getAllTickets();
    const newTicket: Ticket = {
      ...ticket,
      id: tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1
    };
    tickets.push(newTicket);
    this.saveTickets(tickets);
    return newTicket;
  }

  static getTicketsByClientId(clientId: number): Ticket[] {
    const tickets = this.getAllTickets();
    return tickets.filter(t => t.clientId === clientId);
  }

  static getBalanceByClientId(clientId: number): number {
    const tickets = this.getTicketsByClientId(clientId);
    return tickets.reduce((balance, ticket) => {
      return balance + (ticket.type === "Deposit" ? ticket.amount : -ticket.amount);
    }, 0);
  }
}
