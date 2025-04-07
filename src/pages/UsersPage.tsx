
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppUser } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import UsersList from '@/components/users/UsersList';
import UserFormDialog from '@/components/users/UserFormDialog';

const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const openAddDialog = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: AppUser) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['app_users'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Button onClick={openAddDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Crear Usuario
        </Button>
      </div>
      
      <UsersList 
        currentUserId={user.id}
        onEditUser={openEditDialog}
        onRetry={handleRetry}
      />
      
      <UserFormDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingUser={editingUser}
      />
    </div>
  );
};

export default UsersPage;
