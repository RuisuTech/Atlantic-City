
export type MembershipType = "Regular" | "Silver" | "Gold" | "VIP" | "Platinum";

export interface Client {
  id: number;
  name: string;
  dni: string;
  membershipType: MembershipType;
  active: boolean;
}

export class ClientManager {
  private static localStorageKey = "casino-clients";

  static getAllClients(): Client[] {
    const clientsJson = localStorage.getItem(this.localStorageKey);
    return clientsJson ? JSON.parse(clientsJson) : [];
  }

  static saveClients(clients: Client[]): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(clients));
  }

  static addClient(client: Omit<Client, "id">): Client {
    const clients = this.getAllClients();
    const newClient: Client = {
      ...client,
      id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1
    };
    clients.push(newClient);
    this.saveClients(clients);
    return newClient;
  }

  static updateClient(client: Client): void {
    const clients = this.getAllClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index !== -1) {
      clients[index] = client;
      this.saveClients(clients);
    }
  }

  static toggleClientStatus(id: number): void {
    const clients = this.getAllClients();
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
      clients[index].active = !clients[index].active;
      this.saveClients(clients);
    }
  }

  static getClientById(id: number): Client | undefined {
    const clients = this.getAllClients();
    return clients.find(c => c.id === id);
  }

  static isUniqueDni(dni: string, excludeId?: number): boolean {
    const clients = this.getAllClients();
    return !clients.some(c => c.dni === dni && c.id !== excludeId);
  }
}
