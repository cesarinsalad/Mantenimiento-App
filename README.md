# Mantenimiento App

Aplicación para el registro y gestión de mantenimiento, construida con React, Vite y Tailwind CSS.

## Requisitos previos

Asegúrate de tener instalado en tu sistema:
- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- [npm](https://www.npmjs.com/) (viene incluido con Node.js)

## Instalación y Configuración

Sigue estos pasos para correr el proyecto localmente:

1. **Clona el repositorio** (si aún no lo has hecho):
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd mantenimiento-app
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**:
   Crea un archivo `.env` en la raíz del proyecto basándote en un posible archivo `.env.example` o contacta al administrador para obtener las credenciales necesarias (como las de Supabase).

4. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

5. **Abre la aplicación**:
   Visita la URL que aparece en la terminal (usualmente `http://localhost:5173/`).

## Scripts disponibles

En el directorio del proyecto, puedes ejecutar:

- `npm run dev`: Inicia el servidor de desarrollo con Hot-Module-Replacement.
- `npm run build`: Construye la aplicación para producción en la carpeta `dist`.
- `npm run lint`: Ejecuta ESLint para analizar el código en busca de errores.
- `npm run preview`: Inicia un servidor web local para previsualizar la compilación de producción.

## Tecnologías principales

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- [React Router](https://reactrouter.com/)
- [Lucide React](https://lucide.dev/icons/) (Iconos)
- [HTML5 QRCode](https://github.com/mebjas/html5-qrcode) (Escáner de QR)
