
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, UserRole, AppUser } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hashPassword } from '@/utils/password';
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
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'cashier' as UserRole,
    active: true
  });

  // Reset form when editing user changes
  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        password: '',  // We don't show the password when editing
        role: editingUser.role,
        active: editingUser.active
      });
    } else {
      setFormData({
        username: '',
        password: '',
        role: 'cashier',
        active: true
      });
    }
  }, [editingUser, isOpen]);

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; role: UserRole; active: boolean }) => {
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
      toast({
        title: "Error",
        description: "No se pudo agregar el usuario",
        variant: "destructive"
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: { id: string; username: string; password?: string; role: UserRole; active: boolean }) => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value as UserRole }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, active: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Update existing user
      updateUserMutation.mutate({
        id: editingUser.id,
        username: formData.username,
        role: formData.role,
        active: formData.active,
        password: formData.password // Only update password if provided
      });
    } else {
      // Add new user - check required fields
      if (!formData.username || !formData.password) {
        toast({
          title: "Campos requeridos",
          description: "El nombre de usuario y contraseña son obligatorios",
          variant: "destructive"
        });
        return;
      }
      
      // Check username uniqueness
      const { data } = await supabase
        .from('app_users')
        .select('id')
        .eq('username', formData.username);
        
      if (data && data.length > 0) {
        toast({
          title: "Usuario existente",
          description: "Este nombre de usuario ya está en uso",
          variant: "destructive"
        });
        return;
      }
      
      // Add user
      addUserMutation.mutate({
        username: formData.username,
        password: formData.password,
        role: formData.role,
        active: formData.active
      });
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
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                name="username"
                placeholder="usuario123"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required={!editingUser}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select 
                value={formData.role} 
                onValueChange={handleRoleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="cashier">Cajero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="active" 
                checked={formData.active}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="active">Usuario activo</Label>
            </div>
          </div>
          
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
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;
