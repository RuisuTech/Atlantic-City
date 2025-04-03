
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Receipt, TrendingUp, CircleDollarSign, Loader2 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { ClientManager } from "@/models/Client";
import { TicketManager, Ticket } from "@/models/Ticket";

const DashboardPage: React.FC = () => {
  // Fetch clients
  const { 
    data: clients = [], 
    isLoading: isLoadingClients 
  } = useQuery({
    queryKey: ['clients'],
    queryFn: ClientManager.getAllClients
  });

  // Fetch tickets
  const { 
    data: tickets = [], 
    isLoading: isLoadingTickets 
  } = useQuery({
    queryKey: ['tickets'],
    queryFn: TicketManager.getAllTickets
  });

  // Calculate client balances
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

  // Prepare stats
  const clientCount = clients.length;
  const activeClientCount = clients.filter(c => c.active).length;
  const ticketCount = tickets.length;
  
  // Calculate total balance
  const totalBalance = Object.values(clientBalances).reduce((total, balance) => total + balance, 0);
  
  // Sort tickets by date for recent transactions
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Prepare chart data for last 7 days
  const chartData = React.useMemo(() => {
    const now = new Date();
    const lastWeek = new Array(7).fill(0).map((_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i)); // Start from 6 days ago
      return date.toISOString().split("T")[0]; // Get YYYY-MM-DD format
    });

    return lastWeek.map(date => {
      const dayTickets = tickets.filter(t => t.date.startsWith(date));
      const deposits = dayTickets
        .filter(t => t.type === "Deposit")
        .reduce((sum, t) => sum + t.amount, 0);
      const withdrawals = dayTickets
        .filter(t => t.type === "Withdrawal")
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        name: new Date(date).toLocaleDateString("es-ES", { weekday: "short" }),
        deposits,
        withdrawals
      };
    });
  }, [tickets]);

  // Client names map for recent transactions
  const { data: clientsMap = {} } = useQuery({
    queryKey: ['clientsMap'],
    queryFn: async () => {
      const allClients = await ClientManager.getAllClients();
      return allClients.reduce((map: Record<number, string>, client) => {
        map[client.id] = client.name;
        return map;
      }, {});
    }
  });

  const isLoading = isLoadingClients || isLoadingTickets || isLoadingBalances;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inicio</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Clientes" 
          value={clientCount} 
          description={`${activeClientCount} activos`}
          icon={<Users className="h-6 w-6" />}
          color="bg-blue-100 dark:bg-blue-900"
          isLoading={isLoadingClients}
        />
        <StatCard 
          title="Total Boletas" 
          value={ticketCount} 
          description="Depósitos y retiros"
          icon={<Receipt className="h-6 w-6" />}
          color="bg-green-100 dark:bg-green-900"
          isLoading={isLoadingTickets}
        />
        <StatCard 
          title="Balance Total" 
          value={`$${totalBalance.toLocaleString()}`} 
          description="Fondos actuales"
          icon={<CircleDollarSign className="h-6 w-6" />}
          color="bg-yellow-100 dark:bg-yellow-900"
          isLoading={isLoadingBalances}
        />
        <StatCard 
          title="Prom. por Cliente" 
          value={clientCount ? `$${(totalBalance / clientCount).toFixed(2)}` : "$0"} 
          description="Balance promedio"
          icon={<TrendingUp className="h-6 w-6" />}
          color="bg-purple-100 dark:bg-purple-900"
          isLoading={isLoadingBalances || isLoadingClients}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad de Transacciones (Últimos 7 Días)</CardTitle>
            <CardDescription>Depósitos y retiros diarios</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deposits" name="Depósitos" fill="#4ade80" />
                  <Bar dataKey="withdrawals" name="Retiros" fill="#f87171" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>Últimas actividades de depósito y retiro</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {recentTickets.length > 0 ? (
                  recentTickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      className="flex justify-between items-center p-3 rounded-md bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{clientsMap[ticket.clientId] || "Cliente Desconocido"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(ticket.date).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className={`font-medium ${ticket.type === "Deposit" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {ticket.type === "Deposit" ? "+" : "-"}${ticket.amount.toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay transacciones recientes</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, color, isLoading }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <div className="flex items-center h-9 mt-1">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <p className="text-3xl font-bold">{value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardPage;
