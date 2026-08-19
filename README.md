# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Despliegue

El proyecto se publica automáticamente en GitHub Pages mediante el workflow
`.github/workflows/deploy.yml`. Cada `push` a la rama `main` instala las
dependencias con `npm ci`, genera la versión de producción con `npm run build`
y despliega el contenido de `dist` con las acciones oficiales de GitHub Pages.

### Primer despliegue

1. Confirma los cambios y envíalos a `main`:

   ```bash
   git add .
   git commit -m "Configurar GitHub Pages"
   git push
   ```

2. En GitHub, abre la pestaña **Actions** para seguir la ejecución de
   **Deploy to GitHub Pages**. El entorno `github-pages` se crea durante el
   primer despliegue y la URL publicada aparece al finalizar.

El workflow utiliza la fuente **GitHub Actions** de Pages y no crea una rama
`gh-pages` ni requiere copiar manualmente la carpeta `dist`.

### Actualizaciones y despliegues futuros

Cualquier cambio enviado a `main` inicia un despliegue nuevo. También se puede
ejecutar manualmente desde **Actions > Deploy to GitHub Pages > Run workflow**
sin modificar archivos.

### Cambio de nombre del repositorio

No es necesario editar `vite.config.js`. Durante GitHub Actions, Vite obtiene
el nombre desde la variable automática `GITHUB_REPOSITORY`; en compilaciones
locales lo obtiene del remoto Git `origin`. Después de renombrar el repositorio
en GitHub, actualiza el remoto local y vuelve a enviar un cambio a `main`:

```bash
git remote set-url origin https://github.com/USUARIO/NUEVO-NOMBRE.git
git push
```

La ruta base y la URL de Pages se recalcularán automáticamente para el nuevo
nombre. Los repositorios especiales `USUARIO.github.io` utilizan `/` como ruta
base; los demás utilizan `/NOMBRE-DEL-REPOSITORIO/`.
# Autenticación con Supabase

MuebleCAD requiere una sesión de Supabase Auth con correo y contraseña. Para desarrollo, copia `.env.example` como `.env.local` y configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.

En Supabase Dashboard, comprueba que el proveedor **Email** esté habilitado en Authentication. Crea los usuarios manualmente desde **Authentication → Users → Add user**; la aplicación no ofrece registro público.

Para desplegar, crea los repository secrets `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` desde **Settings → Secrets and variables → Actions → New repository secret**. El workflow los inyecta durante el build. Nunca uses una Secret Key ni una clave `service_role` en esta aplicación cliente.

## Desarrollo local

Ejecuta `npm run dev`. Para comprobar producción, ejecuta `npm run build` y luego `npm run preview`.
