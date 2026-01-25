# UniWiz System Requirements Guide

## 🖥️ Hardware Requirements

### **Minimum Requirements:**
- **CPU:** Dual-core processor (Intel i3 or AMD equivalent)
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 2GB free disk space for the project
- **Additional Storage:** 5GB for development tools (Node.js, XAMPP, etc.)

### **Recommended Requirements:**
- **CPU:** Quad-core processor (Intel i5 or AMD Ryzen 5)
- **RAM:** 8GB or more
- **Storage:** SSD with 10GB+ free space
- **Internet:** Stable broadband connection

---

## 💻 Software Requirements

### **Operating System Support:**
- ✅ **Windows 10/11** (Primary support)
- ✅ **macOS 10.15+**
- ✅ **Linux Ubuntu 18.04+**

### **Required Software Stack:**

#### **1. XAMPP (Backend Server)**
- **Version:** XAMPP 8.1+ (includes PHP 8.1+, MySQL 8.0+, Apache)
- **Download:** https://www.apachefriends.org/
- **Purpose:** Backend PHP API and database server

#### **2. Node.js (Frontend)**
- **Version:** Node.js 16.x or 18.x (LTS recommended)
- **Download:** https://nodejs.org/
- **Purpose:** React frontend development and build tools
- **Note:** Includes npm package manager

#### **3. Composer (PHP Dependency Manager)**
- **Version:** Composer 2.x
- **Download:** https://getcomposer.org/
- **Purpose:** PHP backend dependency management (PHPMailer, etc.)
- **Installation:** Download and run installer, add to system PATH

#### **5. Python (Optional - for build tools)**
- **Version:** Python 3.8+
- **Download:** https://www.python.org/
- **Purpose:** Some npm packages may require Python for compilation
- **Note:** Usually needed for node-gyp dependencies

#### **6. Visual C++ Build Tools (Windows)**
- **Version:** Visual Studio Build Tools 2019/2022
- **Download:** https://visualstudio.microsoft.com/downloads/
- **Purpose:** Required for compiling native Node.js modules
- **Alternative:** Install via npm: `npm install -g windows-build-tools`

#### **7. Git (Version Control)**
- **Version:** Git 2.30+
- **Download:** https://git-scm.com/
- **Purpose:** Code version control and collaboration

---

## 🌐 Additional Dependencies

### **Environment Variables:**
Create a `.env` file in the backend directory with:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
DB_HOST=localhost
DB_NAME=uniwiz_db
DB_USER=root
DB_PASS=
```

### **Database Setup:**
1. **Create Database:** Access phpMyAdmin (http://localhost/phpmyadmin)
2. **Import Schema:** Import any provided `.sql` files
3. **Configure Connection:** Update `config/database.php` with correct credentials

### **SSL/HTTPS (Optional):**
- **Local SSL:** Use mkcert for local HTTPS development
- **Production:** Requires valid SSL certificate

---

## 🔧 Development Tools (Optional but Recommended)

### **Code Editor:**
- **Visual Studio Code** (Recommended)
  - Extensions: PHP Intelephense, ES7+ React snippets, Prettier
- **Alternative:** PHPStorm, WebStorm, or Sublime Text

### **Browser Developer Tools:**
- **Chrome DevTools** (Built-in)
- **React Developer Tools** (Browser Extension)
- **Redux DevTools** (If using Redux)

### **API Testing:**
- **Postman** or **Insomnia** (API testing)
- **Thunder Client** (VS Code extension)

---

## 📋 Installation Steps

### **Step 1: Install XAMPP**
1. Download XAMPP from official website
2. Run installer as Administrator (Windows)
3. Select components: Apache, MySQL, PHP, phpMyAdmin
4. Install to default location (C:\xampp)

### **Step 2: Install Composer**
1. Download Composer from https://getcomposer.org/
2. Run `Composer-Setup.exe` (Windows) or follow macOS/Linux instructions
3. Add Composer to system PATH during installation
4. Verify installation: Open terminal/command prompt
   ```bash
   composer --version
   ```

### **Step 3: Install Node.js**
1. Download Node.js LTS version
2. Run installer with default settings
3. Verify installation: Open terminal/command prompt
   ```bash
   node --version
   npm --version
   ```

### **Step 4: Setup Project**
1. Start XAMPP Control Panel
2. Start Apache and MySQL services
3. Clone/extract project to `C:\xampp\htdocs\UniWiz_Parttime`
4. **Install PHP dependencies** (Backend):
   ```bash
   cd C:\xampp\htdocs\UniWiz_Parttime\uniwiz-backend
   composer install
   ```
5. **Install Node.js dependencies** (Frontend):
   ```bash
   cd C:\xampp\htdocs\UniWiz_Parttime\uniwiz-frontend
   npm install
   ```

### **Step 5: Environment Setup**
1. **Create .env file** in backend directory
2. **Configure database** credentials
3. **Set up email** configuration (SMTP)
4. **Create database** via phpMyAdmin
5. **Import database** schema if available

### **Step 6: Verify Installation**
1. **Test backend:** Visit http://localhost/UniWiz_Parttime/uniwiz-backend/api/test.php
2. **Test frontend:** Visit http://localhost:3000
3. **Check database:** Access phpMyAdmin
4. **Verify API:** Test API endpoints with Postman

---

## 🚀 Running the Project

### **Backend (PHP/MySQL):**
1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL** services
3. Access: http://localhost/UniWiz_Parttime/

### **Frontend (React):**
1. Open terminal in `uniwiz-frontend` folder
2. Run development server:
   ```bash
   npm start
   ```
3. Access: http://localhost:3000

---

## ⚠️ Common Issues & Solutions

### **Issue 1: Port Conflicts**
**Problem:** XAMPP Apache won't start (Port 80/443 in use)
**Solution:** 
- Stop IIS service (Windows)
- Change Apache ports in XAMPP config
- Use port 8080 instead

### **Issue 2: Node.js Memory Issues**
**Problem:** React build fails with "out of memory"
**Solution:**
- Increase Node.js memory limit:
  ```bash
  set NODE_OPTIONS=--max_old_space_size=4096
  ```

### **Issue 3: Composer Dependencies Missing**
**Problem:** Backend API errors, PHPMailer not found
**Solution:**
- Navigate to backend folder and install dependencies:
  ```bash
  cd C:\xampp\htdocs\UniWiz_Parttime\uniwiz-backend
  composer install
  ```
- If composer not found, add to system PATH or reinstall

### **Issue 4: PHP Extensions Missing**
**Problem:** Backend API errors
**Solution:**
- Enable required PHP extensions in `php.ini`:
  - `extension=mysqli`
  - `extension=pdo_mysql`
  - `extension=curl`

### **Issue 6: Build Tools Missing (Windows)**
**Problem:** npm install fails with "requires Visual C++"
**Solution:**
- Install Visual Studio Build Tools, or
- Run as Administrator: `npm install -g windows-build-tools`

### **Issue 7: Environment Variables**
**Problem:** Email/database functionality not working
**Solution:**
- Create `.env` file in backend directory
- Add all required environment variables
- Restart Apache after changes

### **Issue 8: CORS Errors**
**Problem:** Frontend can't connect to backend API
**Solution:**
- Check API URLs match your local setup
- Verify CORS headers in PHP files
- Use correct ports (3000 for frontend, 80/8080 for backend)
**Problem:** Backend can't connect to database
**Solution:**
- Check MySQL service is running in XAMPP
- Verify database credentials in `config/database.php`
- Create database if not exists

---

## 📊 Performance Optimization

### **For Low-Spec Computers:**
1. **Close unnecessary programs** while developing
2. **Use production build** for frontend testing:
   ```bash
   npm run build
   ```
3. **Disable hot-reload** if causing issues:
   - Set `FAST_REFRESH=false` in `.env`
4. **Use lightweight code editor** (VS Code with minimal extensions)

### **Database Optimization:**
1. Use **InnoDB engine** for better performance
2. Add **indexes** to frequently queried columns
3. **Limit query results** with pagination

---

## 🔍 System Verification Checklist

### **Before Starting Development:**
- [ ] XAMPP installed and Apache/MySQL services running
- [ ] Node.js and npm installed and working
- [ ] Composer installed and working (`composer --version`)
- [ ] Python installed (if needed for build tools)
- [ ] Visual C++ Build Tools installed (Windows)
- [ ] Project files in correct XAMPP directory
- [ ] Backend PHP dependencies installed (`vendor` folder exists)
- [ ] Frontend dependencies installed (`node_modules` folder exists)
- [ ] Environment variables configured (`.env` file)
- [ ] Database created and configured
- [ ] Both frontend (3000) and backend (80) ports accessible

### **Performance Check:**
- [ ] Frontend loads within 10 seconds
- [ ] Backend API responses within 2 seconds
- [ ] No memory warnings in browser console
- [ ] XAMPP services stable without crashes

---

## 🆘 Troubleshooting Resources

### **Log Files Locations:**
- **Apache Errors:** `C:\xampp\apache\logs\error.log`
- **MySQL Errors:** `C:\xampp\mysql\data\[hostname].err`
- **PHP Errors:** Check browser network tab or enable error display

### **Useful Commands:**
```bash
# Check Node.js and npm versions
node --version && npm --version

# Check Composer version
composer --version

# Install PHP dependencies
composer install

# Update PHP dependencies  
composer update

# Clear npm cache
npm cache clean --force

# Rebuild node modules
rm -rf node_modules && npm install

# Check React build
npm run build

# PHP syntax check
php -l filename.php
```

### **Support Contacts:**
- **Technical Issues:** Check project documentation
- **Development Setup:** Refer to README.md files
- **Database Issues:** Check XAMPP documentation

---

## 📱 Browser Compatibility

### **Supported Browsers:**
- ✅ **Chrome 90+** (Recommended)
- ✅ **Firefox 88+**
- ✅ **Edge 90+**
- ✅ **Safari 14+**

### **Minimum Browser Requirements:**
- JavaScript ES6+ support
- CSS Grid and Flexbox support
- Local Storage support
- Modern fetch API support

---

*Last Updated: September 2025*
*Project: UniWiz Part-time Job Platform*