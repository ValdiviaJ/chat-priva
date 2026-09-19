# QuickChat - Chat Privado 1 a 1 en Tiempo Real

Aplicación web moderna, minimalista y ultra-rápida para mensajería privada uno a uno sin registro, sin logins y con máxima privacidad.

## Características Principales

- **Sin autenticación tradicional:** No hay login, passwords ni perfiles. Identidad gestionada localmente (`client_id`).
- **Cifrado de Extremo a Extremo (E2EE):** Intercambio de claves efímeras mediante Diffie-Hellman en curva elíptica (ECDH P-256) y cifrado simétrico AES-GCM (256-bit) con la Web Crypto API nativa. Los datos viajan cifrados y Supabase no puede leer su contenido.
- **Videollamadas y Llamadas de Voz WebRTC:** Comunicación peer-to-peer fluida con soporte para **Modo Minimizado flotante (Picture-in-Picture)** que permite chatear y navegar mientras la llamada sigue activa.
- **Códigos QR de Acceso Rápido:** Generador de QR dinámico integrado en la creación de sala y en el panel de información para unirse instantáneamente escaneando desde el teléfono móvil.
- **Modo Pánico / Purga Rápida (Stealth Mode):** Doble pulsación rápida de la tecla `Escape` o botón discreto en información para eliminar de inmediato conversaciones locales y redirigir al navegador a una página neutral.
- **Notificaciones del Sistema:** Alertas nativas de navegador en segundo plano para nuevos mensajes y llamadas entrantes cuando la pestaña está minimizada.
- **PWA (Progressive Web App):** Instalable en móviles y ordenadores con Service Worker y soporte offline.
- **Mensajes Temporales / Efímeros:** Temporizador de auto-ocultación de mensajes configurable (5 min, 1 hora, 24 horas).
- **Herramientas de Chat:** Búsqueda en conversación (Ctrl+F), notas de voz con reproductor de ondas, envío de fotos/archivos con galería Lightbox, reacciones rápidas, respuestas (quotes) y mensajes fijados.
- **Modo Oscuro / Claro:** Detección automática del sistema con persistencia en `localStorage`.

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basado en `.env.example`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo Vite.
- `npm run build`: Compila TypeScript y genera los archivos de producción en `dist/` (incluyendo PWA y Service Worker).
- `npm run preview`: Sirve localmente la compilación de producción.
