# UniWiz Part-time Job Platform

A comprehensive web platform connecting university students with part-time job opportunities. UniWiz facilitates the job search process by providing an intuitive interface for students to find suitable positions and for employers to post job listings and manage applications.

## 🌟 Features

### For Students
- **Job Discovery**: Browse and search through available part-time job listings
- **Advanced Filters**: Filter jobs by category, location, and other criteria
- **Application Management**: Apply for jobs and track application status
- **Profile Management**: Create and maintain a detailed student profile
- **CV Upload**: Upload and manage resume documents
- **Messaging System**: Communicate directly with employers
- **Notifications**: Receive real-time updates on applications and messages
- **Review System**: View employer reviews and leave feedback after job completion
- **Wishlist**: Save interesting job opportunities for later

### For Employers/Publishers
- **Job Posting**: Create and publish part-time job listings
- **Application Management**: Review and manage student applications
- **Applicant Screening**: View detailed student profiles and CVs
- **Company Profile**: Showcase company information and culture
- **Messaging**: Communicate with potential candidates
- **Dashboard**: Track job postings, applications, and key metrics
- **Review System**: Build reputation through student reviews

### For Administrators
- **User Management**: Manage student and publisher accounts
- **Job Moderation**: Review and approve job listings
- **Analytics Dashboard**: View platform statistics and insights
- **Category Management**: Organize and manage job categories
- **Report Management**: Handle user reports and disputes
- **Content Moderation**: Ensure platform quality and safety

## 🛠️ Technology Stack

### Frontend
- **React** 18.2.0 - Modern UI library
- **Tailwind CSS** 3.4.15 - Utility-first CSS framework
- **Framer Motion** 12.23.6 - Animation library
- **React Scripts** 5.0.1 - Build tooling

### Backend
- **PHP** - Server-side logic
- **MySQL** - Database management
- **Composer** - Dependency management
- **REST API** - Backend communication

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- PHP (v7.4 or higher)
- MySQL (v5.7 or higher)
- Composer
- A web server (Apache/Nginx)

## 🚀 Getting Started

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tharul-J/UniWiz_Frontend.git
   cd UniWiz_Frontend
   ```

2. **Install frontend dependencies**
   ```bash
   cd uniwiz-frontend
   npm install
   ```

3. **Build Tailwind CSS**
   ```bash
   npm run build:css
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   
   Or with Tailwind CSS watch mode:
   ```bash
   npm run start:with-css
   ```

   The application will open at `http://localhost:3000`

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd uniwiz-backend
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Configure database**
   - Create a MySQL database for the project
   - Update `config/database.php` with your database credentials:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_NAME', 'your_database_name');
     define('DB_USER', 'your_username');
     define('DB_PASSWORD', 'your_password');
     ```

4. **Set up the database tables**
   - Import the database schema (SQL file should be provided)
   - Or run migration scripts if available

5. **Configure web server**
   - Point your web server to the `uniwiz-backend` directory
   - Ensure proper permissions for the `uploads/` directory
   - Enable URL rewriting if necessary

6. **Seed initial data** (Optional)
   ```bash
   php setup_site_settings.php
   php create_test_data.php
   ```

## 📁 Project Structure

```
UniWiz_Frontend/
├── uniwiz-frontend/          # React frontend application
│   ├── public/               # Static files
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── admin/        # Admin-specific components
│   │   │   └── ...          # Other components
│   │   ├── utils/           # Utility functions
│   │   ├── App.js           # Main App component
│   │   └── index.js         # Entry point
│   ├── package.json         # Frontend dependencies
│   └── tailwind.config.js   # Tailwind configuration
│
└── uniwiz-backend/          # PHP backend API
    ├── api/                 # API endpoints
    ├── classes/             # PHP classes
    │   ├── business/        # Business logic
    │   ├── core/            # Core functionality
    │   └── users/           # User management
    ├── config/              # Configuration files
    ├── uploads/             # User uploads directory
    └── composer.json        # Backend dependencies
```

## 🔑 Key Components

### Frontend Components
- **LandingPage**: Home page and public job listings
- **StudentDashboard**: Student control panel
- **PublisherDashboard**: Employer control panel
- **FindJobsPage**: Job search and filtering
- **JobDetailsPage**: Detailed job information
- **ApplyModal**: Job application interface
- **MessagesPage**: Real-time messaging
- **ProfilePage**: User profile management
- **NotificationsPage**: Notification center

### Backend API Endpoints
- `/api/auth.php` - Authentication
- `/api/jobs.php` - Job management
- `/api/applications.php` - Application handling
- `/api/get_messages.php` - Messaging system
- `/api/update_profile.php` - Profile updates
- `/api/upload_cv.php` - File uploads
- And many more...

## 🔐 Environment Variables

Create appropriate configuration files for:
- Database connection details
- API endpoints
- File upload paths
- Email service credentials (if applicable)
- Payment gateway credentials (if applicable)

## 🎨 Available Scripts

### Frontend Scripts

- `npm start` - Start development server
- `npm run start:with-css` - Start with Tailwind CSS watch mode
- `npm run build` - Build for production
- `npm run build:css` - Build Tailwind CSS
- `npm test` - Run tests
- `npm run watch:css` - Watch Tailwind CSS changes

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 👥 Authors

- **Tharul J** - [GitHub](https://github.com/Tharul-J)

## 🐛 Bug Reports

If you encounter any bugs or issues, please create an issue on GitHub with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## 📧 Contact

For questions or support, please open an issue on GitHub or contact the maintainers.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this platform
- Built with modern web technologies and best practices
- Designed to support the student community

---

**Note**: This is a full-stack application. Ensure both frontend and backend are properly configured and running for full functionality.
