# Latido

Latido es una aplicacion Angular en tiempo real para que dos personas compartan mensajes intimos como "Pensando en ti", "Te extrano" o "Te amo" con una experiencia emocional, responsiva y lista para produccion.

## Stack

- Angular 21 standalone + TypeScript + SCSS
- RxJS
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

## 1. Instalacion

```bash
npm install
```

Antes de arrancar, crea tu archivo local de configuracion:

```bash
copy .env.example .env.local
copy .env.example .env.production.local
```

Luego reemplaza los valores `REPLACE_...` por tu config real de Firebase. Esos archivos quedan ignorados por git y no se subiran a GitHub.

Para desarrollo local:

```bash
npm start
```

## 2. Configuracion Firebase

1. Crea un proyecto en Firebase Console.
2. Activa Authentication con `Email/Password` y `Anonymous`.
3. Crea una base de datos de Firestore en modo production.
4. Registra una Web App en Firebase y copia la configuracion.
5. Reemplaza los valores de:
   `.env.local`
   `.env.production.local`

Ejemplo real de estructura:

```ts
export const environment = {
  production: true,
  appName: 'Latido',
  firebase: {
    apiKey: 'AIzaSyExample',
    authDomain: 'latido-app.firebaseapp.com',
    projectId: 'latido-app',
    storageBucket: 'latido-app.firebasestorage.app',
    messagingSenderId: '1234567890',
    appId: '1:1234567890:web:abcdef123456',
    vapidKey: 'BExamplePushKey'
  }
};
```

## 3. Seguridad Firestore

Publica las reglas incluidas en `firestore.rules`:

```bash
npx firebase-tools deploy --only firestore:rules
```

Estas reglas permiten:

- Solo usuarios autenticados
- Acceso solo a participantes de la sala
- Maximo de dos personas por vinculo
- Escritura validada para mensajes y remitente

## 4. Build de produccion

```bash
npm run build -- --configuration production
```

El build queda en `dist/latido/browser`.
Antes del build, el proyecto genera automaticamente `src/environments/environment.ts` y `src/environments/environment.prod.ts` desde tus archivos `.env` locales o desde variables de entorno del CI.

## 5. Deploy en Firebase Hosting

1. Inicia sesion:

```bash
npx firebase-tools login
```

2. Cambia `.firebaserc` con tu `projectId` real:

```json
{
  "projects": {
    "default": "latido-app"
  }
}
```

3. Despliega:

```bash
npx firebase-tools deploy
```

## 6. Conectar dominio personalizado

1. Ve a Firebase Console.
2. Entra a `Hosting`.
3. Haz clic en `Add custom domain`.
4. Escribe tu dominio, por ejemplo `latido.app` o `midominio.com`.
5. Crea los registros DNS que Firebase te entregue.
6. Espera la verificacion SSL automatica.

Flujo tipico de DNS:

- Registro `A` apuntando a la IP entregada por Firebase
- En algunos casos, registro `TXT` para validacion

## 7. Push notifications opcionales

La base deja preparado el campo `vapidKey` en environment para extender el proyecto con Firebase Cloud Messaging. Antes de activarlo en Spark, valida disponibilidad y limites del servicio en tu proyecto.

## 8. Estructura principal

```text
src/
  app/
    components/
    models/
    services/
  environments/
```

## 9. Notas de produccion

- El router usa lazy loading con `loadComponent`
- La UI es mobile-first y responsiva
- Los streams usan `async` pipe y `takeUntilDestroyed` para evitar memory leaks
- `firebase.json` ya incluye rewrite SPA para Hosting
- `index.html` incorpora metadatos SEO basicos y favicon
- Para GitHub Actions o cualquier CI, puedes inyectar `LATIDO_FIREBASE_*` como secrets/variables de entorno sin subir tu config real al repo
