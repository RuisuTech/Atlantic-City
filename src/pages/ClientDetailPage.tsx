
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientManager, Client } from "@/models/Client";
import { TicketManager, Ticket, TicketType } from "@/models/Ticket";
import { ArrowLeft, Plus, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id || "0");
  
  const [client, setClient] = useState<Client | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  
  const [formData, setFormData] = useState({
    type: "Deposit" as TicketType,
    amount: "",
  });

  useEffect(() => {
    // Load client
    const clientData = ClientManager.getClientById(clientId);
    if (clientData) {
      setClient(clientData);
      
      // Load client's tickets
      const clientTickets = TicketManager.getTicketsByClientId(clientId);
      setTickets(clientTickets);
      
      // Calculate balance
      const clientBalance = TicketManager.getBalanceByClientId(clientId);
      setBalance(clientBalance);
    }
  }, [clientId]);

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
      toast.error("Amount is required");
      return;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    // For withdrawals, check if there's enough balance
    if (formData.type === "Withdrawal" && amount > balance) {
      toast.error("Insufficient balance for this withdrawal");
      return;
    }
    
    // Add new ticket
    const newTicket = TicketManager.addTicket({
      clientId,
      type: formData.type,
      amount,
      date: new Date().toISOString(),
    });
    
    // Update state
    setTickets(prev => [...prev, newTicket]);
    
    // Update balance
    const newBalance = formData.type === "Deposit" 
      ? balance + amount 
      : balance - amount;
    setBalance(newBalance);
    
    toast.success(`${formData.type} registered successfully`);
    setIsDialogOpen(false);
  };

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Client not found</h1>
        <Button asChild>
          <Link to="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
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
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Client Details</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Personal and membership details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-muted-foreground">Full Name</h3>
                <p className="text-lg">{client.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">DNI (ID Number)</h3>
                <p className="text-lg">{client.dni}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Membership</h3>
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
                <h3 className="font-medium text-muted-foreground">Status</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block mt-1 ${
                  client.active ? 
                    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : 
                    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}>
                  {client.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Account Summary</CardTitle>
                <CardDescription>Current balance and transactions</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <p className={`text-2xl font-bold ${
                  balance > 0 
                    ? "text-green-600 dark:text-green-400" 
                    : balance < 0 
                      ? "text-red-600 dark:text-red-400" 
                      : ""
                }`}>
                  ${balance.toLocaleString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button onClick={() => openDialog("Deposit")} className="flex-1">
                <Plus className="mr-2 h-4 w-4" /> New Deposit
              </Button>
              <Button 
                onClick={() => openDialog("Withdrawal")} 
                variant="outline" 
                className="flex-1"
                disabled={balance <= 0}
              >
                <Plus className="mr-2 h-4 w-4" /> New Withdrawal
              </Button>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Transaction History</h3>
              {tickets.length > 0 ? (
                <div className="border rounded-md max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...tickets]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(ticket => (
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">No transactions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Register New {formData.type}
            </DialogTitle>
            <DialogDescription>
              Enter the amount for this {formData.type.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
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
                  <p>Available Balance: <span className="font-medium">${balance.toLocaleString()}</span></p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="submit">
                Register {formData.type}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetailPage;
