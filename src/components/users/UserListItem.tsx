
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, AppUser } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';
import { Shield, User, UserCog, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserListItemProps {
  appUser: AppUser;
  currentUserId: string;
  onEditUser: (user: AppUser) => void;
}

const UserListItem: React.FC<UserListItemProps> = ({ 
  appUser, 
  currentUserId,
  onEditUser 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_users'] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente"
      });
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive"
      });
    }
  });

  const toggleUserStatus = (userId: string) => {
    // Don't allow deactivating yourself
    if (userId === currentUserId) {
      toast({
        title: "Acción no permitida",
        description: "No puedes desactivar tu propia cuenta",
        variant: "destructive"
      });
      return;
    }
    
    toggleUserStatusMutation.mutate(userId);
  };

  const deleteUser = (userId: string) => {
    // Don't allow deleting yourself
    if (userId === currentUserId) {
      toast({
        title: "Acción no permitida",
        description: "No puedes eliminar tu propia cuenta",
        variant: "destructive"
      });
      return;
    }
    
    deleteUserMutation.mutate(userId);
  };

  return (
    <TableRow>
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
          disabled={appUser.id === currentUserId} // Can't toggle your own status
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end items-center gap-2">
          <Button
            onClick={() => onEditUser(appUser)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <UserCog className="h-4 w-4" />
            <span>Editar</span>
          </Button>
          
          {appUser.id !== currentUserId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar este usuario?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente al usuario. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteUser(appUser.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserListItem;
