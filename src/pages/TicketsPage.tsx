
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TicketManager, Ticket } from "@/models/Ticket";
import { ClientManager } from "@/models/Client";
import { Search, CalendarIcon, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";

const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "deposit" | "withdrawal">("all");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  // Load tickets from local storage
  useEffect(() => {
    const loadedTickets = TicketManager.getAllTickets();
    setTickets(loadedTickets);
    setFilteredTickets(sortTickets(loadedTickets, sortDirection));
  }, []);

  // Filter and sort tickets based on search term, filter type, and sort direction
  useEffect(() => {
    let filtered = [...tickets];
    
    // Apply type filter
    if (filterType !== "all") {
      const ticketType = filterType === "deposit" ? "Deposit" : "Withdrawal";
      filtered = filtered.filter(ticket => ticket.type === ticketType);
    }
    
    // Apply search filter (search by client name)
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => {
        const client = ClientManager.getClientById(ticket.clientId);
        return client && client.name.toLowerCase().includes(lowerSearch);
      });
    }
    
    // Apply sort
    setFilteredTickets(sortTickets(filtered, sortDirection));
  }, [searchTerm, filterType, tickets, sortDirection]);

  const sortTickets = (tickets: Ticket[], direction: "asc" | "desc"): Ticket[] => {
    return [...tickets].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return direction === "desc" ? dateB - dateA : dateA - dateB;
    });
  };

  const toggleSortDirection = () => {
    const newDirection = sortDirection === "desc" ? "asc" : "desc";
    setSortDirection(newDirection);
  };

  const getClientName = (clientId: number): string => {
    const client = ClientManager.getClientById(clientId);
    return client ? client.name : "Unknown Client";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ticket Management</h1>
      
      <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client..."
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
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deposit">Deposits</SelectItem>
            <SelectItem value="withdrawal">Withdrawals</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          onClick={toggleSortDirection}
          className="flex items-center gap-2"
        >
          Date {sortDirection === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map(ticket => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        {new Date(ticket.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(ticket.date).toLocaleTimeString()}
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
                        {ticket.type}
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
                          View Client
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    {tickets.length === 0 
                      ? "No tickets recorded yet" 
                      : "No tickets match your search criteria"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketsPage;
