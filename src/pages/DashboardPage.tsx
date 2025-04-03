
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientManager } from "@/models/Client";
import { TicketManager, Ticket } from "@/models/Ticket";
import { Users, Receipt, TrendingUp, CircleDollarSign } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

const DashboardPage: React.FC = () => {
  const [clientCount, setClientCount] = useState(0);
  const [activeClientCount, setActiveClientCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [chartData, setChartData] = useState<{ name: string; deposits: number; withdrawals: number }[]>([]);

  useEffect(() => {
    const clients = ClientManager.getAllClients();
    const tickets = TicketManager.getAllTickets();
    
    setClientCount(clients.length);
    setActiveClientCount(clients.filter(c => c.active).length);
    setTicketCount(tickets.length);
    
    const balance = clients.reduce((total, client) => {
      return total + TicketManager.getBalanceByClientId(client.id);
    }, 0);
    setTotalBalance(balance);

    // Get recent tickets
    const recent = [...tickets].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 5);
    setRecentTickets(recent);

    // Prepare chart data
    const now = new Date();
    const lastWeek = new Array(7).fill(0).map((_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    const chartData = lastWeek.map(date => {
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

    setChartData(chartData);
  }, []);

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
        />
        <StatCard 
          title="Total Boletas" 
          value={ticketCount} 
          description="Depósitos y retiros"
          icon={<Receipt className="h-6 w-6" />}
          color="bg-green-100 dark:bg-green-900"
        />
        <StatCard 
          title="Balance Total" 
          value={`$${totalBalance.toLocaleString()}`} 
          description="Fondos actuales"
          icon={<CircleDollarSign className="h-6 w-6" />}
          color="bg-yellow-100 dark:bg-yellow-900"
        />
        <StatCard 
          title="Prom. por Cliente" 
          value={clientCount ? `$${(totalBalance / clientCount).toFixed(2)}` : "$0"} 
          description="Balance promedio"
          icon={<TrendingUp className="h-6 w-6" />}
          color="bg-purple-100 dark:bg-purple-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad de Transacciones (Últimos 7 Días)</CardTitle>
            <CardDescription>Depósitos y retiros diarios</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>Últimas actividades de depósito y retiro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.length > 0 ? (
                recentTickets.map(ticket => {
                  const client = ClientManager.getClientById(ticket.clientId);
                  return (
                    <div 
                      key={ticket.id} 
                      className="flex justify-between items-center p-3 rounded-md bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{client?.name || "Cliente Desconocido"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(ticket.date).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className={`font-medium ${ticket.type === "Deposit" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {ticket.type === "Deposit" ? "+" : "-"}${ticket.amount.toLocaleString()}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">No hay transacciones recientes</p>
              )}
            </div>
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
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, color }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
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
