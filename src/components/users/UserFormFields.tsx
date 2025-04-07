
import React from 'react';
import { Control } from 'react-hook-form';
import * as z from 'zod';
import { UserRole } from '@/integrations/supabase/client';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';

// Base schema for user form fields
export const createUserSchema = z.object({
  username: z.string().min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  role: z.enum(['admin', 'cashier']),
  active: z.boolean().default(true)
});

// Schema for editing - password is optional
export const editUserSchema = createUserSchema.extend({
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }).optional().or(z.literal(''))
});

// Define the props for the form fields component
interface UserFormFieldsProps {
  control: Control<z.infer<typeof createUserSchema>> | Control<z.infer<typeof editUserSchema>>;
  isEditMode: boolean;
}

const UserFormFields: React.FC<UserFormFieldsProps> = ({ control, isEditMode }) => {
  return (
    <>
      <FormField
        control={control}
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
        control={control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {isEditMode ? "Contraseña (dejar en blanco para mantener)" : "Contraseña"}
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
        control={control}
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
        control={control}
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
    </>
  );
};

export default UserFormFields;
