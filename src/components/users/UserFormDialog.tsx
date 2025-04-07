
import React, { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, UserRole, AppUser } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hashPassword } from '@/utils/password';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: AppUser | null;
}

// Define schema for form validation
const createUserSchema = z.object({
  username: z.string().min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  role: z.enum(['admin', 'cashier']),
  active: z.boolean().default(true)
});

// Schema for editing - password is optional
const editUserSchema = createUserSchema.extend({
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }).optional().or(z.literal(''))
});

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  isOpen,
  onOpenChange,
  editingUser
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Determine which schema to use based on editingUser
  const formSchema = editingUser ? editUserSchema : createUserSchema;
  
  // Initialize react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      role: 'cashier' as UserRole,
      active: true
    }
  });

  // Reset form values when editingUser changes
  useEffect(() => {
    if (editingUser) {
      form.reset({
        username: editingUser.username,
        password: '', // Password is empty when editing
        role: editingUser.role,
        active: editingUser.active
      });
    } else {
      form.reset({
        username: '',
        password: '',
        role: 'cashier',
        active: true
      });
    }
  }, [editingUser, isOpen, form]);

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof createUserSchema>) => {
      // Check username uniqueness
      const { data } = await supabase
        .from('app_users')
        .select('id')
        .eq('username', userData.username);
        
      if (data && data.length > 0) {
        throw new Error('Este nombre de usuario ya está en uso');
      }
      
      // Hash the password before saving to the database
      const password_hash = await hashPassword(userData.password);
      
      const { error } = await supabase
        .from('app_users')
        .insert({
          username: userData.username,
          password_hash,
          role: userData.role,
          active: userData.active
        });
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_users'] });
      toast({
        title: "Usuario agregado",
        description: "El usuario ha sido agregado correctamente"
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error adding user:", error);
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo agregar el usuario",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo agregar el usuario",
          variant: "destructive"
        });
      }
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof editUserSchema> & { id: string }) => {
      const updateData: any = {
        username: userData.username,
        role: userData.role,
        active: userData.active
      };
      
      // If a new password is provided, hash it
      if (userData.password && userData.password.trim() !== '') {
        updateData.password_hash = await hashPassword(userData.password);
      }
      
      const { error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', userData.id);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_users'] });
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado correctamente"
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario",
        variant: "destructive"
      });
    }
  });

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        ...data
      });
    } else {
      addUserMutation.mutate(data as z.infer<typeof createUserSchema>);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {editingUser 
              ? "Actualiza la información del usuario a continuación."
              : "Completa los detalles para crear un nuevo usuario."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de Usuario</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {editingUser ? "Contraseña (dejar en blanco para mantener)" : "Contraseña"}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="cashier">Cajero</SelectItem>
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
                    <FormLabel>Usuario activo</FormLabel>
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
                disabled={addUserMutation.isPending || updateUserMutation.isPending}
              >
                {(addUserMutation.isPending || updateUserMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingUser ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;

