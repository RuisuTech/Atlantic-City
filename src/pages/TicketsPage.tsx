
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TicketManager, Ticket, TicketType } from "@/models/Ticket";
import { ClientManager } from "@/models/Client";
import { 
  Search, CalendarIcon, ArrowUp, ArrowDown, Loader2, 
  CreditCard, Banknote, Building, Download, Trash2, Edit 
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateTicketDialog } from "@/components/tickets/CreateTicketDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const TicketsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "deposit" | "withdrawal">("all");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [ticketType, setTicketType] = useState<TicketType>("Deposit");
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  // Determine if we should show only today's tickets based on permissions
  const showOnlyToday = user?.role === 'cashier';

  // Fetch tickets based on role
  const { 
    data: tickets = [], 
    isLoading: isLoadingTickets,
    error: ticketsError
  } = useQuery({
    queryKey: ['tickets', showOnlyToday],
    queryFn: () => showOnlyToday ? TicketManager.getTodayTickets() : TicketManager.getAllTickets()
  });

  // Fetch all clients for name lookups
  const { 
    data: clientsMap = {}, 
    isLoading: isLoadingClients 
  } = useQuery({
    queryKey: ['clientsMap'],
    queryFn: async () => {
      const clients = await ClientManager.getAllClients();
      return clients.reduce((map: Record<number, string>, client) => {
        map[client.id] = client.name;
        return map;
      }, {});
    }
  });

  // Fetch user data for displaying creators
  const { 
    data: usersMap = {}, 
    isLoading: isLoadingUsers 
  } = useQuery({
    queryKey: ['usersMap'],
    queryFn: async () => {
      // Only fetch users if user is admin
      if (user?.role !== 'admin') return {};
      
      const { data, error } = await supabase
        .from('app_users')
        .select('id, username');
        
      if (error) {
        console.error("Error fetching users:", error);
        return {};
      }
      
      return (data || []).reduce((map: Record<string, string>, user) => {
        map[user.id] = user.username;
        return map;
      }, {});
    },
    enabled: user?.role === 'admin'
  });

  // Delete ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: TicketManager.deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['clientBalances'] });
      toast({
        title: "Boleta eliminada",
        description: "La boleta ha sido eliminada correctamente"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la boleta",
        variant: "destructive"
      });
    }
  });

  // Filter and sort tickets
  const filteredTickets = tickets.filter(ticket => {
    // Apply type filter
    if (filterType !== "all") {
      const ticketType = filterType === "deposit" ? "Deposit" : "Withdrawal";
      if (ticket.type !== ticketType) return false;
    }
    
    // Apply search filter (by client name or ticket code)
    if (searchTerm.trim()) {
      const clientName = clientsMap[ticket.clientId] || "";
      const ticketCode = ticket.code || "";
      return clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             ticketCode.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortDirection === "desc" ? dateB - dateA : dateA - dateB;
  });

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "desc" ? "asc" : "desc");
  };

  const getClientName = (clientId: number): string => {
    return clientsMap[clientId] || "Cliente Desconocido";
  };

  const getUserName = (userId?: string): string => {
    if (!userId) return "Sistema";
    return usersMap[userId] || "Usuario Desconocido";
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash": return <Banknote className="h-4 w-4 text-green-600" />;
      case "card": return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "bank_transfer": return <Building className="h-4 w-4 text-purple-600" />;
      default: return <Banknote className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "card": return "Tarjeta";
      case "bank_transfer": return "Transferencia";
      default: return "Desconocido";
    }
  };

  const handleCreateDeposit = () => {
    setTicketType("Deposit");
    setCreateTicketOpen(true);
  };

  const handleCreateWithdrawal = () => {
    setTicketType("Withdrawal");
    setCreateTicketOpen(true);
  };

  const handleDeleteTicket = (id: number) => {
    deleteTicketMutation.mutate(id);
  };

  const handleExportTickets = async () => {
    try {
      // Export based on role permissions
      const csvContent = await TicketManager.exportTicketsToCSV(user?.role === 'cashier');
      
      if (csvContent === "No tickets to export") {
        toast({
          title: "Sin datos",
          description: "No hay boletas para exportar",
          variant: "destructive"
        });
        return;
      }

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `boletas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportación exitosa",
        description: "Las boletas se han exportado correctamente"
      });
    } catch (error) {
      console.error("Error exporting tickets:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al exportar las boletas",
        variant: "destructive"
      });
    }
  };

  if (ticketsError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Error al cargar las boletas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Boletas</h1>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o código..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Tipos</SelectItem>
              <SelectItem value="deposit">Depósitos</SelectItem>
              <SelectItem value="withdrawal">Retiros</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={toggleSortDirection}
            className="flex items-center gap-2"
          >
            Fecha {sortDirection === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex gap-2">
          {(hasPermission('export_all_tickets') || hasPermission('export_today_tickets')) && (
            <Button 
              onClick={handleExportTickets} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> 
              {user?.role === 'cashier' ? 'Exportar (Hoy)' : 'Exportar'}
            </Button>
          )}
          
          {hasPermission('create_tickets') && (
            <>
              <Button 
                onClick={handleCreateDeposit} 
                className="bg-green-600 hover:bg-green-700"
              >
                <ArrowDown className="mr-1 h-4 w-4" /> Depósito
              </Button>
              <Button 
                onClick={handleCreateWithdrawal}
                className="bg-red-600 hover:bg-red-700"
              >
                <ArrowUp className="mr-1 h-4 w-4" /> Retiro
              </Button>
            </>
          )}
        </div>
      </div>
      
      {user?.role === 'cashier' && (
        <div className="bg-blue-50 dark:bg-blue-950 rounded-md p-3 text-blue-700 dark:text-blue-300 text-sm flex items-center">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Como cajero, solo puedes ver las boletas de hoy.
        </div>
      )}
      
      <Card>
        <CardContent className="p-0">
          {isLoadingTickets || isLoadingClients || isLoadingUsers ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary mr-2" />
              <span>Cargando boletas...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  {user?.role === 'admin' && <TableHead>Creado Por</TableHead>}
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map(ticket => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        {ticket.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {new Date(ticket.date).toLocaleDateString('es-ES')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(ticket.date).toLocaleTimeString('es-ES')}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getClientName(ticket.clientId)}
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(ticket.paymentMethod)}
                          <span>{getPaymentMethodLabel(ticket.paymentMethod)}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        ticket.type === "Deposit" 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {ticket.type === "Deposit" ? "+" : "-"}${ticket.amount.toLocaleString()}
                      </TableCell>
                      {user?.role === 'admin' && (
                        <TableCell className="text-xs text-muted-foreground">
                          {getUserName(ticket.createdBy)}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/clients/${ticket.clientId}`}>
                              Ver Cliente
                            </Link>
                          </Button>
                          
                          {hasPermission('manage_tickets') && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar esta boleta?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. La boleta se eliminará permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteTicket(ticket.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={user?.role === 'admin' ? 8 : 7} className="text-center py-6">
                      {tickets.length === 0 
                        ? "No hay boletas registradas aún" 
                        : "No hay boletas que coincidan con tu búsqueda"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateTicketDialog 
        open={createTicketOpen} 
        onOpenChange={setCreateTicketOpen}
        defaultType={ticketType}
        userId={user?.id}
      />
    </div>
  );
};

export default TicketsPage;
