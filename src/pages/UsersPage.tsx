
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, UserRole, AppUser } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Shield, User, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hashPassword } from '@/utils/password';

const UsersPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'cashier' as UserRole,
    active: true
  });

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch users
  const { 
    data: users = [], 
    isLoading: isLoadingUsers,
    error: usersError 
  } = useQuery({
    queryKey: ['app_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }

      return data as AppUser[];
    }
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: Omit<AppUser, 'id' | 'created_at'> & { password: string }) => {
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
      setIsDialogOpen(false);
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
    mutationFn: async (userData: Partial<AppUser> & { password?: string }) => {
      const updateData: any = {};
      if (userData.username) updateData.username = userData.username;
      if (userData.role) updateData.role = userData.role;
      if (userData.active !== undefined) updateData.active = userData.active;
      
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
      setIsDialogOpen(false);
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

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Get current status
      const { data, error: fetchError } = await supabase
        .from('app_users')
        .select('active')
        .eq('id', userId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Toggle status
      const { error } = await supabase
        .from('app_users')
        .update({ active: !data?.active })
        .eq('id', userId);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_users'] });
    },
    onError: (error) => {
      console.error("Error toggling user status:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del usuario",
        variant: "destructive"
      });
    }
  });

  const openAddDialog = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      role: 'cashier',
      active: true
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',  // We don't show the password when editing
      role: user.role,
      active: user.active
    });
    setIsDialogOpen(true);
  };

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

  const toggleUserStatus = (userId: string) => {
    // Don't allow deactivating yourself
    if (userId === user.id) {
      toast({
        title: "Acción no permitida",
        description: "No puedes desactivar tu propia cuenta",
        variant: "destructive"
      });
      return;
    }
    
    toggleUserStatusMutation.mutate(userId);
  };

  if (usersError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Error al cargar los usuarios</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['app_users'] })}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Button onClick={openAddDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Crear Usuario
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoadingUsers ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary mr-2" />
              <span>Cargando usuarios...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map(appUser => (
                    <TableRow key={appUser.id}>
                      <TableCell className="font-medium">{appUser.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {appUser.role === 'admin' ? (
                            <Shield className="h-4 w-4 text-primary" />
                          ) : (
                            <User className="h-4 w-4 text-primary" />
                          )}
                          <span className={`capitalize ${appUser.role === 'admin' ? 'text-primary font-medium' : ''}`}>
                            {appUser.role === 'admin' ? 'Administrador' : 'Cajero'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(appUser.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={appUser.active}
                          onCheckedChange={() => toggleUserStatus(appUser.id)}
                          disabled={appUser.id === user.id} // Can't toggle your own status
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => openEditDialog(appUser)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          disabled={updateUserMutation.isPending}
                        >
                          <UserCog className="h-4 w-4" />
                          <span>Editar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      No hay usuarios registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password_hash">Contraseña</Label>
                  <Input
                    id="password_hash"
                    name="password_hash"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password_hash}
                    onChange={handleInputChange}
                    required={!editingUser}
                  />
                </div>
              )}
              
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
    </div>
  );
};

export default UsersPage;
