# 📚 WebApp de Gestión de Libros (Backend + Frontend)

Proyecto completo de desarrollo de una aplicación web interactiva centrada en la gestión de usuarios y libros, con funcionalidades como favoritos, valoraciones y reseñas. Incluye tanto el diseño y desarrollo del frontend (interfaz de usuario) como la creación de una API RESTful robusta en el backend.

El objetivo ha sido construir una plataforma moderna, segura y escalable, capaz de ofrecer una experiencia fluida al usuario y preparada para futuras ampliaciones.

## 🚀 Tecnologías utilizadas
### Backend
- Python 3.11+
- Django 5
- Django REST Framework
- SimpleJWT (autenticación por tokens JWT)
- drf-yasg (documentación OpenAPI/Swagger)
- PostgreSQL (despliegue en Railway)

### Frontend
- Angular 16+
- TypeScript
- Angular Material (para componentes UI)
- RxJS
- SweetAlert2 (para notificaciones y diálogos interactivos)

## 🔎 Funcionalidades principales
- Registro y autenticación (login) de usuarios
- Gestión de perfil y actualización de contraseñas
- Añadir y eliminar libros favoritos
- Añadir y eliminar libros de la wishlist
- Valoración y reseñas de libros favoritos
- Consulta de libros más populares
- Visualización de perfiles públicos
- Sistema de throttling y medidas avanzadas de seguridad
- Interfaz responsive y moderna desarrollada en Angular

## 📁 Estructura principal del proyecto

### 📂 Backend
```
├── api
│   ├── migrations
│   ├── notifications
│   ├── security
│   ├── templates
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── tests.py
│   ├── urls.py
│   └── views.py
├── books
│   ├── migrations
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── tests.py
│   ├── urls.py
│   ├── utils.py
│   └── views.py
├── documentation
│   ├── openapi.yaml
│   └── README.md
├── media
├── profile_pics
├── constants.py
├── db.sqlite3
├── manage.py
└── mysite
```

### 📂 Frontend (estructura real)
```
├── front
│   └── frontApp
│       ├── .vscode
│       ├── public
│       ├── src
│       │   ├── app
│       │   │   ├── auth
│       │   │   ├── components
│       │   │   ├── services
│       │   │   └── utils
│       │   ├── assets
│       │   ├── environ
│       │   ├── index.html
│       │   ├── main.server.ts
│       │   ├── main.ts
│       │   ├── server.ts
│       │   └── styles.css
│       ├── angular.json
│       ├── package.json
│       └── tsconfig.json
```

## 🛡️ Seguridad y rendimiento
- HTTPS forzado en producción
- Cookies seguras y protección CSRF
- Throttling para login, registro y endpoints sensibles
- Caché en endpoints públicos
- Optimización de carga en frontend con lazy loading

## 📈 Estado del proyecto
✅ Desarrollo finalizado — actualmente en fase de documentación, optimización de rendimiento y validación completa de funcionalidades antes del despliegue definitivo. Tercera versión (tag) publicada.

## 📧 Autor
**Javier Delgado Chacón**  
GitHub: [https://github.com/JavierDCH12](https://github.com/JavierDCH12)  

## 📄 Licencia
Este proyecto está licenciado bajo los términos de la licencia BSD.
