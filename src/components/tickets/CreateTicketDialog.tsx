
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { Client, ClientManager } from "@/models/Client";
import { TicketManager, TicketType } from "@/models/Ticket";

const ticketSchema = z.object({
  clientId: z.number().int().positive("Debes seleccionar un cliente"),
  amount: z.number().positive("El monto debe ser mayor a cero"),
  type: z.enum(["Deposit", "Withdrawal"]),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TicketType;
}

export function CreateTicketDialog({ open, onOpenChange, defaultType = "Deposit" }: CreateTicketDialogProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      clientId: undefined,
      amount: undefined,
      type: defaultType,
    },
  });

  // Cargar la lista de clientes activos
  useEffect(() => {
    const loadClients = async () => {
      const allClients = await ClientManager.getAllClients();
      // Solo mostrar clientes activos
      const activeClients = allClients.filter(client => client.active);
      setClients(activeClients);
    };
    
    if (open) {
      loadClients();
      // Reset the form when opening the dialog with the default type
      form.reset({ clientId: undefined, amount: undefined, type: defaultType });
    }
  }, [open, form, defaultType]);

  const onSubmit = async (values: TicketFormValues) => {
    setIsLoading(true);
    try {
      const result = await TicketManager.addTicket({
        clientId: values.clientId,
        type: values.type,
        amount: values.amount,
        date: new Date().toISOString(),
      });

      if (result) {
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({
          queryKey: ['tickets']
        });
        await queryClient.invalidateQueries({
          queryKey: ['clients', values.clientId]
        });
        
        toast({
          title: values.type === "Deposit" ? "Depósito realizado" : "Retiro realizado",
          description: `Se ha registrado un ${values.type === "Deposit" ? "depósito" : "retiro"} de $${values.amount} correctamente.`,
        });
        
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: "No se pudo registrar la operación.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al crear la boleta:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar la operación.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {form.watch("type") === "Deposit" 
              ? "Nuevo depósito" 
              : "Nuevo retiro"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de operación</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Deposit">
                        <div className="flex items-center gap-2">
                          <ArrowDown className="h-4 w-4 text-green-500" />
                          <span>Depósito</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Withdrawal">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-4 w-4 text-red-500" />
                          <span>Retiro</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-7" 
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
                className={form.watch("type") === "Deposit" 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-red-600 hover:bg-red-700"}
              >
                {isLoading ? "Procesando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
