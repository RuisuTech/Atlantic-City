
import { supabase } from "@/integrations/supabase/client";

export type MembershipType = "Regular" | "Silver" | "Gold" | "VIP" | "Platinum";

export interface Client {
  id: number;
  name: string;
  dni: string;
  membershipType: MembershipType;
  active: boolean;
}

export class ClientManager {
  static async getAllClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      console.error("Error fetching clients:", error);
      return [];
    }

    return data.map(client => ({
      id: client.id,
      name: client.name,
      dni: client.dni,
      membershipType: client.membership_type as MembershipType,
      active: client.active
    }));
  }

  static async addClient(client: Omit<Client, "id">): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        dni: client.dni,
        membership_type: client.membershipType,
        active: client.active
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding client:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      dni: data.dni,
      membershipType: data.membership_type as MembershipType,
      active: data.active
    };
  }

  static async updateClient(client: Client): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({
        name: client.name,
        dni: client.dni,
        membership_type: client.membershipType,
        active: client.active
      })
      .eq('id', client.id);

    if (error) {
      console.error("Error updating client:", error);
    }
  }

  static async toggleClientStatus(id: number): Promise<void> {
    // First get the current status
    const { data, error: fetchError } = await supabase
      .from('clients')
      .select('active')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error("Error fetching client status:", fetchError);
      return;
    }

    // Then toggle it
    const { error: updateError } = await supabase
      .from('clients')
      .update({ active: !data.active })
      .eq('id', id);

    if (updateError) {
      console.error("Error toggling client status:", updateError);
    }
  }

  static async getClientById(id: number): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching client:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      dni: data.dni,
      membershipType: data.membership_type as MembershipType,
      active: data.active
    };
  }

  static async isUniqueDni(dni: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('clients')
      .select('id')
      .eq('dni', dni);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error checking DNI uniqueness:", error);
      return false;
    }

    return data.length === 0;
  }
}
