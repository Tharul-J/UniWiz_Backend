# UniWiz Backend

PHP REST API backend for the UniWiz part-time job platform.

## 🛠️ Technology Stack

- **PHP** (v7.4+)
- **MySQL** (v5.7+)
- **Composer** - Dependency management

## 📋 Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Composer
- Web server (Apache/Nginx)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tharul-J/UniWiz_Backend.git
   cd UniWiz_Backend
   ```

2. **Install dependencies**
   ```bash
   composer install
   ```

3. **Configure database**
   - Create a MySQL database
   - Update [config/database.php](config/database.php) with your credentials

4. **Set up database** tables and run optional seed scripts

5. **Configure web server** and set permissions for uploads directory

## 🔑 API Endpoints

- Authentication: `/api/auth.php`, `/api/verify_email.php`
- Jobs: `/api/get_public_jobs.php`, `/api/create_job.php`
- Applications: `/api/applications.php`
- Messaging: `/api/send_message.php`, `/api/get_messages.php`
- Profile: `/api/update_profile.php`, `/api/upload_cv.php`
- Admin: `/api/get_all_users_admin.php`, `/api/get_all_jobs_admin.php`

## 🔗 Frontend

Frontend repository: [UniWiz_Frontend](https://github.com/Tharul-J/UniWiz_Frontend)


