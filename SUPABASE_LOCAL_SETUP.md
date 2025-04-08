
# Instrucciones para Configuración Local de Supabase

Este documento contiene las instrucciones para configurar una instancia local de Supabase y conectarla a esta aplicación.

## Requisitos Previos

1. Tener [Docker](https://www.docker.com/products/docker-desktop/) instalado
2. Tener [Git](https://git-scm.com/downloads) instalado
3. Tener [Node.js](https://nodejs.org/) instalado (versión 16 o superior)
4. Tener [npm](https://www.npmjs.com/) instalado (viene con Node.js)

## Paso 1: Configurar Supabase Localmente

### 1.1 Instalar Supabase CLI

```bash
# Con npm
npm install -g supabase

# O con yarn
yarn global add supabase
```

### 1.2 Iniciar Supabase Localmente

```bash
# Crear un directorio para Supabase
mkdir supabase-local
cd supabase-local

# Inicializar Supabase
supabase init

# Iniciar los servicios de Supabase
supabase start
```

Después de ejecutar estos comandos, Supabase CLI mostrará las URL y claves necesarias para conectarte. Deberías ver algo como:

```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJh...
service_role key: eyJh...
```

## Paso 2: Crear la Estructura de la Base de Datos

### 2.1 Exportar la Estructura Actual de la Base de Datos

Si ya tienes una base de datos de Supabase en producción, puedes exportar su estructura:

```bash
# Reemplaza [PROJECT_ID] con tu ID de proyecto de Supabase
supabase db dump -p [PROJECT_ID] --db-url postgresql://postgres:postgres@localhost:54322/postgres > schema.sql
```

### 2.2 Recrear las Tablas Localmente

Aquí está el script SQL para recrear las tablas necesarias para esta aplicación:

```sql
-- Crear tipo de rol de usuario
CREATE TYPE public.user_role AS ENUM ('admin', 'cashier');

-- Crear tabla de usuarios
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'cashier',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de clientes
CREATE TABLE public.clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  membership_type TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de tickets
CREATE TABLE public.tickets (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES public.clients(id),
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  code TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  created_by UUID REFERENCES public.app_users(id),
  updated_by UUID REFERENCES public.app_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Crear función para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar el campo updated_at
CREATE TRIGGER set_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
```

Puedes ejecutar este script en el SQL Editor de Supabase Studio local (http://localhost:54323).

## Paso 3: Actualizar la Configuración de la Aplicación

### 3.1 Crear Archivo de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=[tu_anon_key_local]
```

Reemplaza `[tu_anon_key_local]` con la clave anon que te proporcionó Supabase CLI al iniciar los servicios.

### 3.2 Actualizar el Cliente de Supabase

Modifica el archivo `src/integrations/supabase/client.ts` para utilizar las variables de entorno:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Utiliza variables de entorno si están disponibles, de lo contrario usa los valores predeterminados
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://uyheexfmcnnqkswmdtcs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5aGVleGZtY25ucWtzd21kdGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NDg2OTAsImV4cCI6MjA1OTIyNDY5MH0.I3O9Q31PxD8RufO6Kz8qt3UzV1vitkT-B1GnKArbsY4";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Resto del código...
```

## Paso 4: Añadir Datos de Prueba

Para añadir datos de prueba, puedes ejecutar el siguiente script SQL en Supabase Studio:

```sql
-- Insertar usuario administrador
INSERT INTO public.app_users (username, password_hash, role)
VALUES (
  'admin',
  -- Contraseña: admin123
  '$2a$10$CLKR3RHl1bYl8aPSI8E6SOBz4.XVECREJ9nhj/HvB0Z65ZhJJZ3we',
  'admin'
);

-- Insertar usuario cajero
INSERT INTO public.app_users (username, password_hash, role)
VALUES (
  'cajero',
  -- Contraseña: cajero123
  '$2a$10$9MUQkyrj2wf8MWE1gZZhLu2jNuaGSDEf9RWW9Cf.DJg2xM9L0JBb2',
  'cashier'
);

-- Insertar algunos clientes
INSERT INTO public.clients (name, dni, membership_type)
VALUES 
  ('Juan Pérez', '12345678A', 'Regular'),
  ('María López', '87654321B', 'Gold'),
  ('Carlos Rodríguez', '11223344C', 'Silver'),
  ('Ana Martínez', '44332211D', 'Platinum');

-- Insertar algunos tickets
INSERT INTO public.tickets (client_id, type, amount, payment_method, code)
VALUES 
  (1, 'Deposit', 1000, 'cash', 'TICK-00001-123'),
  (1, 'Withdrawal', 500, 'cash', 'TICK-00001-124'),
  (2, 'Deposit', 2000, 'card', 'TICK-00002-125'),
  (3, 'Deposit', 1500, 'bank_transfer', 'TICK-00003-126');
```

## Paso 5: Iniciar la Aplicación

```bash
# Instalar dependencias
npm install

# Iniciar la aplicación en modo desarrollo
npm run dev
```

La aplicación debería estar ahora conectada a tu instancia local de Supabase.

## Solución de Problemas Comunes

### CORS Errors
Si experimentas errores CORS, verifica que las URLs en el archivo `.env.local` sean correctas y que Supabase esté configurado para permitir solicitudes desde tu aplicación.

### Errores de Autenticación
Si tienes problemas para iniciar sesión, verifica que los usuarios se hayan creado correctamente y que los hashes de contraseña sean válidos.

### Errores de Conexión a la Base de Datos
Asegúrate de que los servicios de Supabase estén funcionando ejecutando `supabase status`.
