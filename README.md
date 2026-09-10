# PrivateChat - Chat Privado 1 a 1 en Tiempo Real

Aplicación web moderna, minimalista y ultra-rápida para mensajería privada uno a uno sin registro, sin logins y sin contraseñas.

## Caracteristicas Principales

- **Sin autenticación tradicional:** No hay login, passwords ni perfiles. La identidad de cada usuario se gestiona mediante un identificador local único (`client_id`).
- Tiempo real con Supabase: Mensajes instantáneos con suscripciones Realtime (PostgreSQL changes).
- Salas 1 a 1 con código seguro: Generación y validación de códigos de 8 caracteres alfanuméricos.
- Límite estricto de 2 personas: Solo 2 participantes pueden conectarse a la misma sala.
- Indicadores de presencia y escritura: Estado en línea y 'escribiendo...' bidireccional.
- Modo Oscuro / Claro: Detección automática del sistema con persistencia en `localStorage`.
- Responsive: Diseñado pensando en móviles (`h-[100dvh]`) y escritorios.
- Listo para Vercel: Configuración optimizada para despliegue estático en Vercel con SPA fallback.

## Variables de Entorno

Crea un archivo `.env` en la raóz del proyecto basado en `.env.example`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo Vite.
- `npm run build`: Compila TypeScript y genera los archivos de producción en `dist/`.
- `npm run preview`: Sirve localmente la compilación de producción.
