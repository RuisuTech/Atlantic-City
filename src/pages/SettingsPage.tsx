
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Moon, Sun, Shield } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Only administrators can access settings
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración</h1>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="about">Acerca de</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias</CardTitle>
              <CardDescription>
                Configura las preferencias visuales y de comportamiento del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme-toggle">Tema Oscuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Cambia entre el modo claro y oscuro
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className={`h-5 w-5 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Switch 
                    id="theme-toggle" 
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                  <Moon className={`h-5 w-5 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>Acerca del Sistema</CardTitle>
              <CardDescription>
                Información sobre la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <span className="text-secondary">♦</span>
                    Atlantic City Casino - Sistema de Gestión
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Versión 1.0.0
                  </p>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Roles del Sistema</span>
                  </h4>
                  <div className="mt-3 space-y-3">
                    <div className="bg-primary/5 p-3 rounded-md">
                      <h5 className="font-medium">Administrador</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        Acceso completo a todas las funcionalidades: gestión de usuarios,
                        clientes, boletas, configuración.
                      </p>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-md">
                      <h5 className="font-medium">Cajero</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        Acceso limitado: ver clientes activos, crear boletas de depósito/retiro,
                        exportar boletas del día.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
