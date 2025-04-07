
import React, { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, UserRole, AppUser } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hashPassword } from '@/utils/password';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import UserFormFields, { createUserSchema, editUserSchema } from './UserFormFields';

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: AppUser | null;
}

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
            <UserFormFields 
              control={form.control} 
              isEditMode={!!editingUser} 
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
