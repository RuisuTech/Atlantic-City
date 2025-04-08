
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ClientManager, Client } from "@/models/Client";
import { Search, User, UserPlus, Edit, UserX } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ClientFormDialog from "@/components/clients/ClientFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const ClientsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  // Check if user is logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check permission to view clients
  const canViewAllClients = hasPermission('view_all_clients');
  const canViewActiveClients = hasPermission('view_active_clients');
  
  if (!canViewAllClients && !canViewActiveClients) {
    return <Navigate to="/dashboard" />;
  }

  // Fetch clients based on role
  const { 
    data: clients = [],
    isLoading: isLoadingClients 
  } = useQuery({
    queryKey: ['clients', canViewAllClients ? 'all' : 'active'],
    queryFn: async () => {
      return ClientManager.getAllClients(!canViewAllClients);
    }
  });

  const toggleClientStatusMutation = useMutation({
    mutationFn: ClientManager.toggleClientStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del cliente ha sido actualizado correctamente"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del cliente",
        variant: "destructive"
      });
    }
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.dni.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleClientStatus = (id: number) => {
    toggleClientStatusMutation.mutate(id);
  };

  const openAddDialog = () => {
    setEditingClient(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
        <Button onClick={openAddDialog} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Agregar Cliente
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Membresía</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map(client => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.dni}</TableCell>
                  <TableCell>{client.membershipType}</TableCell>
                  <TableCell>
                    <Switch
                      checked={client.active}
                      onCheckedChange={() => toggleClientStatus(client.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(client)}>
                        <Edit className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      
                      {hasPermission('manage_clients') && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive">
                              <UserX className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Desactivar este cliente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción cambiará el estado del cliente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => toggleClientStatus(client.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClientFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingClient={editingClient}
      />
    </div>
  );
};

export default ClientsPage;
