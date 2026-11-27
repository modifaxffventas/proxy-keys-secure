# Valhalla

PROM PARA CREAR UNA PLATAFORMA DE CONFIGURACIÓN DE PROXY CON LOGIN POR KEYS Y PANEL ADMIN OCULTO

OBJETIVO DEL PROYECTO

Crear una aplicación web moderna que permita a los usuarios configurar conexiones proxy mediante una interfaz guiada.  

El sistema debe incluir:

• Login con keys generadas por el administrador  

• Interfaz de configuración de proxy  

• Panel administrador oculto para generar keys  

• Optimización para dispositivos móviles  

• Diseño elegante en blanco y negro  

• Visualización de información de red del usuario (IP, tipo de señal, ubicación, duración de la key, con permisos)  

El sistema debe ser profesional, rápido y visualmente limpio.

--------------------------------------------------

ESTRUCTURA PRINCIPAL

El proyecto tendrá dos partes principales:

1. Interfaz de configuración de proxy (pública)  

2. Panel de administración oculto

Rutas:

Ruta pública:

/

Ruta de administrador (oculta):

/admin

El panel admin no debe mostrarse en menús ni enlaces visibles. Solo se accede escribiendo manualmente la URL.

--------------------------------------------------

SISTEMA DE LOGIN

La aplicación inicia con una pantalla de login.

Título de la pantalla:

Conexión Proxy

Elementos del login:

• Foto de perfil (la que se proporcionará)  

• Logo de verificación estilo TikTok  

• Formulario de login moderno  

• Diseño minimalista  

Campos requeridos:

Nombre  

Key de acceso

El usuario debe ingresar ambos campos para acceder.  

Si la key es válida, el usuario entra al panel de configuración de proxy.  

Si la key no es válida, el sistema mostrará:

Key inválida. Por favor contacta al administrador.

--------------------------------------------------

DISEÑO DEL LOGIN

La pantalla de login debe verse profesional y moderna.

Elementos de diseño:

• Foto de perfil centrada  

• Logo de verificación al lado del nombre  

• Tarjeta de login limpia  

• Fondo negro  

• Texto en blanco  

• Sombras suaves  

Para que la pantalla no se vea vacía, incluir un texto informativo al pie en inglés:

Secure Proxy Configuration System

This platform allows authorized users to configure network proxy connections using secure access keys.  

All connections are monitored and optimized for stability and performance.

--------------------------------------------------

INTERFAZ DE CONFIGURACIÓN DE PROXY

Tras el login, el usuario entra al panel de proxy.

Título:

Configurar Conexión Proxy

Opciones:

• Desactivada  

• Manual  

• Automática

Campos a completar:

Servidor  

Puerto  

Toggle: Autenticación

Si la autenticación está activada, aparecen:

Usuario  

Contraseña (la key generada desde el panel admin)  

Ejemplo de usuario: módex_001

--------------------------------------------------

INFORMACIÓN DE RED DEL USUARIO

Al activar la conexión, el sistema debe pedir permisos para mostrar información del dispositivo.  

Si el usuario acepta, mostrar:

• IP  

• Tipo de red (WiFi / Celular)  

• Ubicación aproximada  

• Tipo de señal  

• Duración de la key  

La información debe mostrarse organizada de forma clara, por ejemplo:

Información

• IP: xxx.xxx.xxx.xxx  

• Tipo de red: WiFi  

• Ubicación: Ciudad / País  

• Señal: Fuerte  

• Duración de key: 7 días

--------------------------------------------------

BOTÓN DE CONEXIÓN

Al final de la interfaz habrá un botón:

Conectar al Servidor

Al presionarlo, el sistema inicia la configuración del proxy.  

Debe mostrarse animación de conexión.

--------------------------------------------------

PANEL ADMINISTRADOR

Ruta:

/admin

No debe haber enlaces visibles que lo expongan.

Contraseña de acceso: 117

Solo el administrador puede entrar.

--------------------------------------------------

DISEÑO DEL PANEL ADMIN

Optimizado para móviles.  

Características:

• Dashboard limpio  

• Colores principales: blanco y negro  

• Botones grandes y fáciles de tocar  

• Animaciones suaves  

• Diseño profesional estilo corporativo  

--------------------------------------------------

FUNCIONES DEL PANEL ADMIN

Generación de keys:

• Tipo de key: Normal / Premium  

• Duración: 1 minuto, 1 día, 7 días, 30 días  

• Cantidad de keys a generar  

• Prefijo en todas las keys: módifaxff  

Ejemplo de key: módifaxff-A92K-L7D3

Lista de keys generadas:

• Key  

• Tipo  

• Estado: Activa / Usada / Expirada  

• Duración  

• Fecha de creación  

--------------------------------------------------

CONTROL DE KEYS

Cuando una key es usada, se marca automáticamente como usada.  

Cada key solo puede usarse una vez.  

El sistema almacena:

• Nombre del usuario  

• Key utilizada  

• Fecha de activación  

• Fecha de expiración  

--------------------------------------------------

EXPERIENCIA DEL USUARIO

• Rápida y fluida  

• Minimalista y profesional  

• Información clara y ordenada  

• Compatible con dispositivos móviles  

--------------------------------------------------

OBJETIVO FINAL

Crear una plataforma segura de configuración de proxy donde:

• Los usuarios acceden mediante keys generadas por el administrador  

• Las keys tienen duración configurable  

• Las keys premium también pueden expirar y ofrecer información avanzada  

• El panel admin es oculto y optimizado para móvil  

• La experiencia visual es elegante y profesional

Utiliza colores serios y formales que no se acerque la pantalla y utiliza como fondo preterminado del wep  la primera imagen y la segunda como perfil y la contra del admin es 117 porfavor todo hordenado y lo mismo con el login y que se mire el fondo dela wep

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://proxy-keys-secure.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c4f22ff8-59f3-4b81-9f07-6c6cc30f4e6b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
