
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, User, KeyRound, Loader2, UserPlus } from "lucide-react";
import { supabase, UserRole } from "@/integrations/supabase/client";
import { hashPassword } from "@/utils/password";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  
  // Nuevo estado para el formulario de registro
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "cashier" as UserRole // Fixed: explicitly type as UserRole
  });
  const [isRegistering, setIsRegistering] = useState(false);

  if (user?.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(username, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRoleChange = (value: UserRole) => {
    setRegisterForm(prev => ({ ...prev, role: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!registerForm.username || !registerForm.password) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    
    if (registerForm.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    setIsRegistering(true);
    
    try {
      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('username', registerForm.username)
        .single();
        
      if (existingUser) {
        toast.error("Este nombre de usuario ya está en uso");
        return;
      }
      
      // Crear el hash de la contraseña
      const password_hash = await hashPassword(registerForm.password);
      
      // Crear el nuevo usuario
      const { error } = await supabase
        .from('app_users')
        .insert({
          username: registerForm.username,
          password_hash,
          role: registerForm.role, // Now correctly typed as UserRole
          active: true
        });
        
      if (error) {
        console.error("Error al crear usuario:", error);
        toast.error("Error al crear el usuario");
        return;
      }
      
      toast.success("Usuario creado correctamente");
      
      // Limpiar el formulario y cambiar a la pestaña de login
      setRegisterForm({
        username: "",
        password: "",
        confirmPassword: "",
        role: "cashier" as UserRole
      });
      
      // Establecer los valores para el login
      setUsername(registerForm.username);
      setPassword(registerForm.password);
      
      // Cambiar a la pestaña de login
      const loginTab = document.querySelector('[data-state="inactive"][value="login"]') as HTMLElement;
      if (loginTab) loginTab.click();
      
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      toast.error("Error al crear el usuario");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2 justify-center">
            <span className="text-secondary">♦</span>
            Atlantic City Casino
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder al sistema de gestión
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              <span>Iniciar Sesión</span>
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Crear Usuario</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Roles</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    placeholder="Ingresa tu usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Nombre de Usuario</Label>
                  <Input
                    id="reg-username"
                    name="username"
                    placeholder="usuario123"
                    value={registerForm.username}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Contraseña</Label>
                  <Input
                    id="reg-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    La contraseña debe tener al menos 6 caracteres.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm-password">Confirmar Contraseña</Label>
                  <Input
                    id="reg-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-role">Rol de Usuario</Label>
                  <Select 
                    value={registerForm.role} 
                    onValueChange={(value: string) => handleRoleChange(value as UserRole)}
                  >
                    <SelectTrigger id="reg-role">
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="cashier">Cajero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando usuario...
                    </>
                  ) : (
                    "Crear Usuario"
                  )}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="roles" className="space-y-4 pt-4">
            <CardContent>
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <h3 className="font-medium">Administrador</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Acceso completo: gestión de usuarios, clientes, boletas, configuración.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <h3 className="font-medium">Cajero</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Acceso limitado: ver clientes activos, crear boletas de depósito/retiro.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginPage;
