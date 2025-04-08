
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Client, ClientManager, MembershipType } from '@/models/Client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Esquema de validación para el cliente
const clientSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
  dni: z.string().length(8, { message: 'El DNI debe tener exactamente 8 dígitos' }).regex(/^\d+$/, { message: 'El DNI debe contener solo números' }),
  membershipType: z.enum(['Regular', 'Silver', 'Gold', 'VIP', 'Platinum']),
  active: z.boolean().default(true)
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient: Client | null;
}

const ClientFormDialog: React.FC<ClientFormDialogProps> = ({
  isOpen,
  onOpenChange,
  editingClient
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Inicializa el formulario con react-hook-form
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      dni: '',
      membershipType: 'Regular',
      active: true
    }
  });

  // Actualiza el formulario cuando cambia el cliente en edición
  useEffect(() => {
    if (editingClient) {
      form.reset({
        name: editingClient.name,
        dni: editingClient.dni,
        membershipType: editingClient.membershipType,
        active: editingClient.active
      });
    } else {
      form.reset({
        name: '',
        dni: '',
        membershipType: 'Regular',
        active: true
      });
    }
  }, [editingClient, form, isOpen]);

  // Mutación para agregar cliente
  const addClientMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      // Verificar si el DNI ya existe
      const isDniUnique = await ClientManager.isUniqueDni(data.dni);
      if (!isDniUnique) {
        throw new Error('Este DNI ya está registrado');
      }
      
      return ClientManager.addClient({
        name: data.name,
        dni: data.dni,
        membershipType: data.membershipType as MembershipType,
        active: data.active
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Cliente agregado",
        description: "El cliente ha sido agregado correctamente"
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error al agregar cliente:", error);
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo agregar el cliente",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo agregar el cliente",
          variant: "destructive"
        });
      }
    }
  });

  // Mutación para actualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: async (data: ClientFormValues & { id: number }) => {
      // Verificar si el DNI ya existe (excluyendo el ID actual)
      const isDniUnique = await ClientManager.isUniqueDni(data.dni, data.id);
      if (!isDniUnique) {
        throw new Error('Este DNI ya está registrado por otro cliente');
      }
      
      return ClientManager.updateClient({
        id: data.id,
        name: data.name,
        dni: data.dni,
        membershipType: data.membershipType as MembershipType,
        active: data.active
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Cliente actualizado",
        description: "El cliente ha sido actualizado correctamente"
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error al actualizar cliente:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive"
      });
    }
  });

  // Maneja el envío del formulario
  const onSubmit = (data: ClientFormValues) => {
    if (editingClient) {
      updateClientMutation.mutate({
        id: editingClient.id,
        ...data
      });
    } else {
      addClientMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingClient ? "Editar Cliente" : "Crear Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {editingClient 
              ? "Actualiza la información del cliente a continuación."
              : "Completa los detalles para crear un nuevo cliente."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI (8 dígitos)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="12345678" 
                      maxLength={8}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="membershipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Membresía</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar membresía" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="Platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Cliente activo</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit"
                disabled={addClientMutation.isPending || updateClientMutation.isPending}
              >
                {(addClientMutation.isPending || updateClientMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingClient ? "Guardar Cambios" : "Crear Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientFormDialog;
