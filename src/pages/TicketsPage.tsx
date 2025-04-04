
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TicketManager, Ticket, TicketType } from "@/models/Ticket";
import { ClientManager } from "@/models/Client";
import { Search, CalendarIcon, ArrowUp, ArrowDown, Loader2, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CreateTicketDialog } from "@/components/tickets/CreateTicketDialog";

const TicketsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "deposit" | "withdrawal">("all");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [ticketType, setTicketType] = useState<TicketType>("Deposit");

  // Fetch all tickets
  const { 
    data: tickets = [], 
    isLoading: isLoadingTickets,
    error: ticketsError
  } = useQuery({
    queryKey: ['tickets'],
    queryFn: TicketManager.getAllTickets
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

  // Filter and sort tickets
  const filteredTickets = tickets.filter(ticket => {
    // Apply type filter
    if (filterType !== "all") {
      const ticketType = filterType === "deposit" ? "Deposit" : "Withdrawal";
      if (ticket.type !== ticketType) return false;
    }
    
    // Apply search filter (by client name)
    if (searchTerm.trim()) {
      const clientName = clientsMap[ticket.clientId] || "";
      return clientName.toLowerCase().includes(searchTerm.toLowerCase());
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

  const handleCreateDeposit = () => {
    setTicketType("Deposit");
    setCreateTicketOpen(true);
  };

  const handleCreateWithdrawal = () => {
    setTicketType("Withdrawal");
    setCreateTicketOpen(true);
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
              placeholder="Buscar por cliente..."
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
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoadingTickets || isLoadingClients ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary mr-2" />
              <span>Cargando boletas...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map(ticket => (
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
                      <TableCell className={`text-right font-medium ${
                        ticket.type === "Deposit" 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {ticket.type === "Deposit" ? "+" : "-"}${ticket.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/clients/${ticket.clientId}`}>
                            Ver Cliente
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
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
      />
    </div>
  );
};

export default TicketsPage;
