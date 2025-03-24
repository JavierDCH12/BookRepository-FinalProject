# 📚 WebApp de Gestión de Libros (Backend + Frontend)

Proyecto de desarrollo completo de una aplicación web para la gestión de usuarios, libros favoritos, valoraciones y reseñas. Incluye tanto la API backend como el frontend interactivo.

## 🚀 Tecnologías utilizadas
### Backend
- Python 3.11+
- Django 5
- Django REST Framework
- SimpleJWT (autenticación por tokens JWT)
- drf-yasg (documentación OpenAPI/Swagger)
- PostgreSQL (en producción) / SQLite (en desarrollo)

### Frontend
- Angular 16+
- TypeScript
- Angular Material (para componentes UI)
- RxJS
- SweetAlert2 (para notificaciones y diálogos interactivos)

## 🔎 Funcionalidades principales
- Registro y autenticación de usuarios
- Gestión de perfil y foto de usuario
- Añadir y eliminar libros favoritos
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
- Índices de base de datos en campos clave para optimización
- Caché en endpoints públicos
- Optimización de carga en frontend con lazy loading

## 📈 Estado del proyecto
✅ Desarrollo en curso — fase de documentación, optimización y últimas pruebas de integración.

## 📧 Autor
**Javier Delgado Chacón**  
GitHub: [https://github.com/JavierDCH1](https://github.com/JavierDCH1)  

## 📄 Licencia
Este proyecto está licenciado bajo los términos de la licencia BSD.
