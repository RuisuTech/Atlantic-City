
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, AppUser } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import UserListItem from './UserListItem';

interface UsersListProps {
  currentUserId: string;
  onEditUser: (user: AppUser) => void;
  onRetry: () => void;
}

const UsersList: React.FC<UsersListProps> = ({ 
  currentUserId, 
  onEditUser,
  onRetry
}) => {
  // Fetch users
  const { 
    data: users = [], 
    isLoading, 
    error 
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

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Error al cargar los usuarios</p>
        <Button onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
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
                  <UserListItem 
                    key={appUser.id}
                    appUser={appUser}
                    currentUserId={currentUserId}
                    onEditUser={onEditUser}
                  />
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
  );
};

export default UsersList;
