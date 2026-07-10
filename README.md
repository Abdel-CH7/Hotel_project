# SPS Project

This is a monorepo containing both the frontend and backend code for the SPS Project.

## Project Structure

```
sps-project/
├── sps-project-backend/    # Laravel Backend
└── sps-project-frontend/   # React Frontend
```

## Backend Setup (Laravel)

1. Navigate to the backend directory:
   ```bash
   cd sps-project-backend
   ```

2. Install PHP dependencies:
   ```bash
   composer install
   ```

3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

4. Generate application key:
   ```bash
   php artisan key:generate
   ```

5. Configure your database in `.env` file

6. Run migrations and seeders:
   ```bash
   php artisan migrate:fresh --seed
   ```

7. Start the development server:
   ```bash
   php artisan serve
   ```

## Frontend Setup (React)

1. Navigate to the frontend directory:
   ```bash
   cd sps-project-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Development

- Backend API runs on: http://localhost:8000
- Frontend development server runs on: http://localhost:3000

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is proprietary and confidential. 