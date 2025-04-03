
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ClientManager, Client, MembershipType } from "@/models/Client";
import { TicketManager } from "@/models/Ticket";
import { Search, Plus, Edit, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const MEMBERSHIP_TYPES: MembershipType[] = ["Regular", "Silver", "Gold", "VIP", "Platinum"];

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    dni: "",
    membershipType: "Regular" as MembershipType,
    active: true
  });

  // Load clients from local storage
  useEffect(() => {
    const loadedClients = ClientManager.getAllClients();
    setClients(loadedClients);
    setFilteredClients(loadedClients);
  }, []);

  // Filter clients based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }
    
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = clients.filter(
      client => 
        client.name.toLowerCase().includes(lowerSearch) ||
        client.dni.toLowerCase().includes(lowerSearch) ||
        client.membershipType.toLowerCase().includes(lowerSearch)
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const openAddDialog = () => {
    setEditingClient(null);
    setFormData({
      name: "",
      dni: "",
      membershipType: "Regular",
      active: true
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      dni: client.dni,
      membershipType: client.membershipType,
      active: client.active
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, membershipType: value as MembershipType }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, active: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim() || !formData.dni.trim()) {
      toast.error("All fields are required");
      return;
    }
    
    // Check for unique DNI
    const isDniUnique = editingClient 
      ? ClientManager.isUniqueDni(formData.dni, editingClient.id)
      : ClientManager.isUniqueDni(formData.dni);
    
    if (!isDniUnique) {
      toast.error("DNI must be unique");
      return;
    }
    
    if (editingClient) {
      // Update existing client
      const updatedClient = {
        ...editingClient,
        name: formData.name,
        dni: formData.dni,
        membershipType: formData.membershipType,
        active: formData.active
      };
      
      ClientManager.updateClient(updatedClient);
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      toast.success("Client updated successfully");
    } else {
      // Add new client
      const newClient = ClientManager.addClient({
        name: formData.name,
        dni: formData.dni,
        membershipType: formData.membershipType,
        active: formData.active
      });
      
      setClients(prev => [...prev, newClient]);
      toast.success("Client added successfully");
    }
    
    setIsDialogOpen(false);
  };

  const toggleClientStatus = (id: number) => {
    ClientManager.toggleClientStatus(id);
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, active: !c.active };
      }
      return c;
    }));
  };

  const getClientBalance = (clientId: number): number => {
    return TicketManager.getBalanceByClientId(clientId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Client Management</h1>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map(client => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.dni}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.membershipType === "Platinum" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                        client.membershipType === "VIP" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                        client.membershipType === "Gold" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                        client.membershipType === "Silver" ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" :
                        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }`}>
                        {client.membershipType}
                      </span>
                    </TableCell>
                    <TableCell className={`font-medium ${
                      getClientBalance(client.id) > 0 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      ${getClientBalance(client.id).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={client.active}
                        onCheckedChange={() => toggleClientStatus(client.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          asChild
                        >
                          <Link to={`/clients/${client.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    {searchTerm ? "No clients found" : "No clients yet. Add your first client!"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Edit Client" : "Add New Client"}
            </DialogTitle>
            <DialogDescription>
              {editingClient 
                ? "Update the client's information below."
                : "Fill in the client's details to add them to the system."
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dni">DNI (ID Number)</Label>
                <Input
                  id="dni"
                  name="dni"
                  placeholder="12345678"
                  value={formData.dni}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="membershipType">Membership Type</Label>
                <Select 
                  value={formData.membershipType} 
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select membership type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBERSHIP_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="active" 
                  checked={formData.active}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="active">Active client</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit">
                {editingClient ? "Save Changes" : "Add Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
