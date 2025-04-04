
import React, { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientManager } from "@/models/Client";
import { TicketManager, TicketType } from "@/models/Ticket";
import { ArrowLeft, Plus, CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id || "0");
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    type: "Deposit" as TicketType,
    amount: "",
  });

  // Fetch client data
  const { 
    data: client, 
    isLoading: isLoadingClient,
    error: clientError 
  } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => ClientManager.getClientById(clientId)
  });

  // Fetch client's tickets
  const { 
    data: tickets = [], 
    isLoading: isLoadingTickets,
  } = useQuery({
    queryKey: ['tickets', clientId],
    queryFn: () => TicketManager.getTicketsByClientId(clientId),
    enabled: !!client
  });

  // Calculate client's balance
  const { 
    data: balance = 0, 
    isLoading: isLoadingBalance 
  } = useQuery({
    queryKey: ['balance', clientId],
    queryFn: () => TicketManager.getBalanceByClientId(clientId),
    enabled: !!client
  });

  // Add ticket mutation
  const addTicketMutation = useMutation({
    mutationFn: TicketManager.addTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', clientId] });
      queryClient.invalidateQueries({ queryKey: ['balance', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clientBalances'] });
      toast.success(`${formData.type === "Deposit" ? "Depósito" : "Retiro"} registrado correctamente`);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error(`Error al registrar ${formData.type === "Deposit" ? "depósito" : "retiro"}`);
    }
  });

  const openDialog = (type: TicketType) => {
    setFormData({
      type,
      amount: "",
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.amount.trim()) {
      toast.error("El monto es obligatorio");
      return;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }
    
    // For withdrawals, check if there's enough balance
    if (formData.type === "Withdrawal" && amount > balance) {
      toast.error("Saldo insuficiente para este retiro");
      return;
    }
    
    // Add new ticket
    addTicketMutation.mutate({
      clientId,
      type: formData.type,
      amount,
      date: new Date().toISOString(),
      paymentMethod: "cash" // Default to cash payment method
    });
  };

  // Show loading state
  if (isLoadingClient) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Cargando información del cliente...</p>
      </div>
    );
  }

  // Show error state
  if (clientError || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Cliente no encontrado</h1>
        <Button asChild>
          <Link to="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Clientes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" asChild>
          <Link to="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Detalles del Cliente</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
            <CardDescription>Datos personales y de membresía</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-muted-foreground">Nombre Completo</h3>
                <p className="text-lg">{client.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">DNI (Número de Identificación)</h3>
                <p className="text-lg">{client.dni}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Membresía</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block mt-1 ${
                  client.membershipType === "Platinum" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                  client.membershipType === "VIP" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                  client.membershipType === "Gold" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                  client.membershipType === "Silver" ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" :
                  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                }`}>
                  {client.membershipType}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Estado</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block mt-1 ${
                  client.active ? 
                    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : 
                    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}>
                  {client.active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Resumen de Cuenta</CardTitle>
                <CardDescription>Balance actual y transacciones</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Balance Actual</p>
                {isLoadingBalance ? (
                  <div className="flex justify-end items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Calculando...</span>
                  </div>
                ) : (
                  <p className={`text-2xl font-bold ${
                    balance > 0 
                      ? "text-green-600 dark:text-green-400" 
                      : balance < 0 
                        ? "text-red-600 dark:text-red-400" 
                        : ""
                  }`}>
                    ${balance.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button 
                onClick={() => openDialog("Deposit")} 
                className="flex-1"
                disabled={addTicketMutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" /> Nuevo Depósito
              </Button>
              <Button 
                onClick={() => openDialog("Withdrawal")} 
                variant="outline" 
                className="flex-1"
                disabled={balance <= 0 || addTicketMutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" /> Nuevo Retiro
              </Button>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Historial de Transacciones</h3>
              {isLoadingTickets ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <p>Cargando transacciones...</p>
                </div>
              ) : tickets.length > 0 ? (
                <div className="border rounded-md max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map(ticket => (
                        <TableRow key={ticket.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              {new Date(ticket.date).toLocaleDateString('es-ES')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(ticket.date).toLocaleTimeString('es-ES')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              ticket.type === "Deposit" 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}>
                              {ticket.type === "Deposit" ? "Depósito" : "Retiro"}
                            </span>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            ticket.type === "Deposit" 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-red-600 dark:text-red-400"
                          }`}>
                            {ticket.type === "Deposit" ? "+" : "-"}${ticket.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">No hay transacciones aún</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Registrar Nuevo {formData.type === "Deposit" ? "Depósito" : "Retiro"}
            </DialogTitle>
            <DialogDescription>
              Ingresa el monto para este {formData.type === "Deposit" ? "depósito" : "retiro"}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto ($)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              {formData.type === "Withdrawal" && balance > 0 && (
                <div className="text-sm">
                  <p>Saldo Disponible: <span className="font-medium">${balance.toLocaleString()}</span></p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="submit"
                disabled={addTicketMutation.isPending}
              >
                {addTicketMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registrar {formData.type === "Deposit" ? "Depósito" : "Retiro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetailPage;
