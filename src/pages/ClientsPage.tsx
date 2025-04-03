
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ClientManager, Client, MembershipType } from "@/models/Client";
import { TicketManager } from "@/models/Ticket";
import { Search, Plus, Edit, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const MEMBERSHIP_TYPES: MembershipType[] = ["Regular", "Silver", "Gold", "VIP", "Platinum"];

const ClientsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    dni: "",
    membershipType: "Regular" as MembershipType,
    active: true
  });

  // Fetch clients using React Query
  const { 
    data: clients = [], 
    isLoading: isLoadingClients,
    error: clientsError
  } = useQuery({
    queryKey: ['clients'],
    queryFn: ClientManager.getAllClients
  });

  // Calculate balances for each client
  const { 
    data: clientBalances = {}, 
    isLoading: isLoadingBalances 
  } = useQuery({
    queryKey: ['clientBalances'],
    queryFn: async () => {
      const balances: Record<number, number> = {};
      for (const client of clients) {
        balances[client.id] = await TicketManager.getBalanceByClientId(client.id);
      }
      return balances;
    },
    enabled: clients.length > 0
  });

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: ClientManager.addClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Cliente agregado correctamente");
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Error al agregar cliente");
    }
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: ClientManager.updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Cliente actualizado correctamente");
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Error al actualizar cliente");
    }
  });

  // Toggle client status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ClientManager.toggleClientStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: () => {
      toast.error("Error al cambiar estado del cliente");
    }
  });

  // Filter clients based on search term
  const filteredClients = clients.filter(client => {
    if (!searchTerm.trim()) return true;
    
    const lowerSearch = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(lowerSearch) ||
      client.dni.toLowerCase().includes(lowerSearch) ||
      client.membershipType.toLowerCase().includes(lowerSearch)
    );
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim() || !formData.dni.trim()) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    
    // Check for unique DNI
    const isDniUnique = await ClientManager.isUniqueDni(
      formData.dni, 
      editingClient?.id
    );
    
    if (!isDniUnique) {
      toast.error("El DNI debe ser único");
      return;
    }
    
    if (editingClient) {
      // Update existing client
      updateClientMutation.mutate({
        ...editingClient,
        name: formData.name,
        dni: formData.dni,
        membershipType: formData.membershipType,
        active: formData.active
      });
    } else {
      // Add new client
      addClientMutation.mutate({
        name: formData.name,
        dni: formData.dni,
        membershipType: formData.membershipType,
        active: formData.active
      });
    }
  };

  const toggleClientStatus = (id: number) => {
    toggleStatusMutation.mutate(id);
  };

  if (clientsError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Error al cargar los clientes</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Agregar Cliente
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoadingClients ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
              <span className="ml-2">Cargando clientes...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Membresía</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
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
                        isLoadingBalances ? "text-muted-foreground" :
                        (clientBalances[client.id] || 0) > 0 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {isLoadingBalances ? (
                          <Loader2 className="h-4 w-4 animate-spin inline-block mr-1" />
                        ) : (
                          `$${(clientBalances[client.id] || 0).toLocaleString()}`
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={client.active}
                          onCheckedChange={() => toggleClientStatus(client.id)}
                          disabled={toggleStatusMutation.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(client)}
                            disabled={updateClientMutation.isPending}
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
                      {searchTerm ? "No se encontraron clientes" : "No hay clientes aún. ¡Agrega tu primer cliente!"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Editar Cliente" : "Agregar Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {editingClient 
                ? "Actualiza la información del cliente a continuación."
                : "Completa los detalles del cliente para agregarlo al sistema."
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dni">DNI (Número de Identificación)</Label>
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
                <Label htmlFor="membershipType">Tipo de Membresía</Label>
                <Select 
                  value={formData.membershipType} 
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de membresía" />
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
                <Label htmlFor="active">Cliente activo</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="submit"
                disabled={addClientMutation.isPending || updateClientMutation.isPending}
              >
                {(addClientMutation.isPending || updateClientMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingClient ? "Guardar Cambios" : "Agregar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
