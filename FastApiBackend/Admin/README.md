# Admin Module Documentation

## Descripción del Módulo
Este módulo maneja las funcionalidades relacionadas con admin. Aquí puedes describir en detalle la finalidad, los casos de uso y la lógica de negocio del módulo. ¿Qué resuelve este módulo? ¿Cómo se integra con otros módulos del sistema?

## Diagrama de Arquitectura
Adjunta un enlace al diagrama de la arquitectura del módulo. Puedes usar Excalidraw, Lucidchart, o cualquier otra herramienta de diagramas. Por ejemplo, puedes pegar aquí el enlace del diagrama generado en Excalidraw:
[Diagrama de Arquitectura del Módulo](https://excalidraw.com/#json=TU_DIAGRAMA_LINK)

## Estructura de Carpetas
El módulo sigue la siguiente estructura de carpetas:
- `api/`: Contiene las rutas y controladores.
- `models/`: Define los modelos de datos.
- `repositories/`: Contiene las funciones de acceso a datos.
- `services/`: Contiene los servicios que procesan la lógica del negocio.
- `validations/`: Funciones de validación de datos de entrada.
- `exports/`: Archivos relacionados con la exportación de datos.
- `utils/`: Funciones utilitarias para el módulo.

## Rutas API
Las siguientes rutas están disponibles en este módulo:
1. `POST /admin/v1/create`: Crea un nuevo usuario.
2. `GET /admin/v1/hola`: Devuelve un mensaje de saludo.

## Servicios
Este módulo proporciona los siguientes servicios:
- `register_user`: Registra un nuevo usuario en el sistema.

## Repositorios
El módulo interactúa con la base de datos a través del repositorio `main_users_repository`.
Este repositorio maneja la creación y obtención de usuarios.
