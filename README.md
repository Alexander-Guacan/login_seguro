# Login Seguro

Integrantes: Alexander Guacán, Ariel Guevara
Institución: Universidad de las Fuerzas Armadas ESPE
Materia: Desarrollo de Software Seguro
NRC: 27894

## Stack Tecnológico

- Frontend: React (interfaz de usuario responsiva)
- Backend: NestJS (API REST con arquitectura modular)
- Base de datos: PostgreSQL (persistencia relacional segura)
- Autenticación: JWT (manejo de sesiones sin estado)
- Biometría: WebAuthn (autenticación biométrica a nivel de dispositivo)

## Arquitectura

- Frontend (cliente)
- Backend (lógica de negocios y seguridad)
- Base de datos (persistencia)

## Repositorio

- Sera un solo repositorio Git
- Usaremos 3 ramas principales:
    - develop: desarrollo activo de funcionalidades
    - test: integración y validación mediante workflows automáticos
    - main: versión estable del proyecto

Flujo de trabajo:
1. Desarrollo de funcionalidades en la rama develop.
2. Creación de Pull Request hacia la rama test.
3. Ejecución automática de:
   - Análisis estático de código (SAST) mediante SonarQube.
   - Análisis de vulnerabilidades mediante el modelo de IA.
4. Si ambos análisis son satisfactorios:
   - Se permite el merge a la rama test.
   Caso contrario:
   - El workflow se detiene y se rechaza el merge.
5. En la rama test se ejecutan:
   - Pruebas automatizadas del backend.
   - Pruebas automatizadas del frontend.
6. Si las pruebas automatizadas son exitosas:
   - Se realiza el merge a la rama main.
   Caso contrario:
   - El proceso se detiene hasta su corrección.

## Roles de equipo

### Alexander Guacán

Roles:
- Team Leader
- Security / Quality Manager

Responsabilidades:
- Planificación general del proyecto
- Seguimiento del cronograma y cumplimiento del SDLC
- Coordinación de tareas del equipo
- Definición y validación de requisitos de seguridad
- Supervisión del threat modeling y pruebas de seguridad
- Validación de entregables finales

### Ariel Guevara

Roles:

- Development Manager
- Configuration / Process Manager

Responsabilidades:
- Diseño e implementación del backend y frontend
- Gestión del repositorio Git y control de versiones
- Configuración de GitHub Actions y CI/CD
- Integración del modelo de IA en pipeline
- Gestión de evidencias técnicas del proyecto
