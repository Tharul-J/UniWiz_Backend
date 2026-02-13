# UniWiz Backend

PHP REST API backend for the UniWiz part-time job platform.

## 🛠️ Technology Stack

- **PHP** (v7.4+)
- **MySQL** (v5.7+)
- **Composer** - Dependency management
- **PHPMailer** - Email notifications
- **Stripe API** - Payment processing

## 📋 Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Composer
- Web server (Apache/Nginx)
- SMTP server for email notifications (optional)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tharul-J/UniWiz_Backend.git
   cd UniWiz_Backend
   ```

2. **Install dependencies**
   ```bash
   cd uniwiz-backend
   composer install
   ```

3. **Configure environment**
   - Create a `.env` file in the `uniwiz-backend` directory
   - Add your database credentials:
     ```
     DB_HOST=localhost
     DB_NAME=uniwiz_db
     DB_USER=root
     DB_PASS=
     ```

4. **Configure database**
   - Create a MySQL database
   - Import database schema
   - Run optional seed scripts for test data

5. **Configure web server** 
   - Point document root to `uniwiz-backend` directory
   - Set permissions for `api/uploads/` directory (755 recommended)

6. **Update CORS settings**
   - Update allowed origins in API files if needed (default: `http://localhost:3000`)

## 🔑 API Endpoints

### Authentication
- `POST /api/auth.php` - User login/registration
- `GET /api/verify_email.php` - Email verification
- `POST /api/reset_password.php` - Password reset

### Jobs
- `GET /api/get_public_jobs.php` - Fetch public job listings
- `POST /api/create_job.php` - Create new job posting
- `GET /api/get_job_details.php` - Get specific job details
- `PUT /api/update_job.php` - Update job posting
- `GET /api/get_recommended_jobs.php` - Get personalized recommendations

### Applications
- `POST /api/applications.php` - Submit job application
- `GET /api/get_applications.php` - Get user's applications
- `PUT /api/update_application_status.php` - Update application status

### Messaging
- `POST /api/send_message.php` - Send message
- `GET /api/get_messages.php` - Retrieve conversations
- `GET /api/get_conversations.php` - List all conversations

### Profile Management
- `PUT /api/update_profile.php` - Update user profile
- `POST /api/upload_cv.php` - Upload CV/resume
- `POST /api/upload_profile_picture.php` - Upload profile picture
- `GET /api/get_student_profile.php` - Get student profile
- `GET /api/get_company_profile.php` - Get company profile

### Admin
- `GET /api/get_all_users_admin.php` - List all users
- `GET /api/get_all_jobs_admin.php` - List all jobs
- `GET /api/get_admin_stats.php` - Get dashboard statistics
- `PUT /api/update_user_status_admin.php` - Manage user status

## 📁 Project Structure

```
uniwiz-backend/
├── api/              # API endpoints
├── classes/          # Business logic & models
│   ├── business/     # Business entities
│   ├── core/         # Core utilities
│   └── users/        # User-related classes
├── config/           # Configuration files
├── vendor/           # Composer dependencies
└── composer.json     # Dependencies
```

## 🔒 Security Features

- Password hashing with bcrypt
- Email validation and verification
- SQL injection prevention via PDO prepared statements
- CORS protection
- Input sanitization

## 🔗 Frontend

Frontend repository: [UniWiz_Frontend](https://github.com/Tharul-J/UniWiz_Frontend)

## 📄 License

This project is part of the UniWiz platform.

## 👥 Contributing

Contributions are welcome! Please ensure code quality and test thoroughly before submitting pull requests.


