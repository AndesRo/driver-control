📦 Driver - Control de Entregas
Aplicación web para conductores de que permite registrar órdenes de entrega, controlar rutas y generar reportes financieros con retención del 15.25%. Desarrollada con React + Vite + Tailwind CSS y Supabase como backend.

🚀 Características
✅ Autenticación con email/contraseña (registro e inicio de sesión).

🔐 Datos por usuario: cada conductor ve solo sus propias órdenes mediante políticas RLS en Supabase.

📝 Registro de órdenes: número de orden, comuna (con tarifa automática), ruta (especial para Las Condes: 1, 2, 3, K), fecha y estado (entregado, parcial, no entregado).

📋 Listado diario: filtro por fecha, resumen de entregados/parciales/no entregados, total bruto.

✏️ Edición y eliminación de órdenes.

📊 Reporte financiero: filtro por rango de fechas, cálculo de retención (15.25%) y neto.

📁 Exportación: a Excel (.xlsx) y PDF con tabla detallada.

📱 Diseño responsive y accesible, con temática dark orange moderno.

🖼️ SEO y Open Graph: imagen y descripción al compartir en redes.

🛠️ Tecnologías
Frontend: React 18, Vite, Tailwind CSS 3, React Router 6.

Backend: Supabase (PostgreSQL, autenticación, RLS).

Bibliotecas adicionales: @supabase/supabase-js, xlsx, jspdf, jspdf-autotable.

📋 Requisitos previos
Node.js (v18 o superior) y npm.

Cuenta en Supabase (plan gratuito).

Cuenta en GitHub y Vercel para despliegue.

⚙️ Configuración

1. Clonar el repositorio

git clone https://github.com/tu-usuario/driver-jumbo.git
cd driver-jumbo

2. Instalar dependencias

npm install

3. Variables de entorno
   Crea un archivo .env.local en la raíz con tus credenciales de Supabase:

VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica

4. Configurar Supabase
   a) Crear tablas y políticas RLS
   Ejecuta el siguiente SQL en el editor SQL de Supabase:

-- Tabla de tarifas por comuna
CREATE TABLE tarifas (
comuna TEXT PRIMARY KEY,
monto_bruto INTEGER NOT NULL
);

-- Insertar tarifas (según captura)
INSERT INTO tarifas (comuna, monto_bruto) VALUES
('LAS CONDES', 3932),
('LA REINA', 3510),
('VITACURA', 4610),
('NUNOA', 3957),
('PEÑALOLÉN', 4057),
('SANTIAGO', 4257),
('LO BARNECHEA', 5110),
('MACUL', 4310),
('RECOLETA', 5212),
('PUENTE ALTO', 8962),
('PROVIDENCIA', 4257);

-- Tabla de órdenes (con ruta como TEXT)
CREATE TABLE orders (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
order_number TEXT NOT NULL,
comuna TEXT NOT NULL REFERENCES tarifas(comuna),
monto_bruto INTEGER NOT NULL,
fecha DATE NOT NULL DEFAULT CURRENT_DATE,
ruta TEXT,
estado TEXT DEFAULT 'entregado' CHECK (estado IN ('entregado', 'parcial', 'no_entregado')),
user_id UUID REFERENCES auth.users(id),
created_at TIMESTAMPTZ DEFAULT now()
);

-- Políticas RLS
ALTER TABLE tarifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política para tarifas (lectura pública)
CREATE POLICY "Todos pueden leer tarifas" ON tarifas FOR SELECT USING (true);

-- Políticas para orders (cada usuario ve y modifica solo sus propias órdenes)
CREATE POLICY "Usuarios pueden ver sus órdenes" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden insertar sus órdenes" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden actualizar sus órdenes" ON orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden eliminar sus órdenes" ON orders FOR DELETE USING (auth.uid() = user_id);

🧑‍💻 Uso de la aplicación
Registro / Login
Crea una cuenta con email y contraseña (mínimo 6 caracteres).

Recibirás un correo de confirmación (si está habilitado). Haz clic en el enlace para activar tu cuenta.

Registrar una orden
Selecciona la comuna (el monto bruto se calcula automáticamente).

Si la comuna es LAS CONDES, se mostrarán las opciones de ruta: 1, 2, 3, K.

Para otras comunas, el campo ruta se deshabilita y queda como "Sin ruta" (puedes editarlo manualmente si es necesario).

Completa número de orden, fecha y estado.

Haz clic en Guardar.

Listado de órdenes
Filtra por fecha para ver las órdenes de ese día.

Puedes editar o eliminar cada orden.

Ver resumen de entregados, parciales y no entregados, y total bruto.

Reporte financiero
Selecciona un rango de fechas (o déjalo vacío para ver todas).

Se muestra el total bruto, la retención (15.25%) y el neto.

Exporta a Excel o PDF con el detalle de cada orden.

🔒 Seguridad
Cada usuario solo puede ver y gestionar sus propias órdenes gracias a las políticas RLS.

Las contraseñas se manejan de forma segura mediante Supabase Auth.

Las variables de entorno protegen las claves de API.

🤝 Contribución
Si deseas mejorar la app, haz un fork, crea una rama y envía un pull request. Para reportar errores, abre un issue en GitHub.

📄 Licencia
MIT © [Andrés Romero]

👤 Autor
Andrés Romero – GitHub – andespart.ar@gmail.com
