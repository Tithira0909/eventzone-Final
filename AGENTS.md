# Deployment Guide for Digital Ocean

This guide provides step-by-step instructions for deploying this application on a Digital Ocean droplet with Nginx already installed.

## 1. Database Setup (MySQL)

First, you'll need to set up a MySQL database and user for the application.

### 1.1. Install MySQL Server

```bash
sudo apt update
sudo apt install mysql-server
```

### 1.2. Secure MySQL Installation

Run the security script and follow the prompts. It's recommended to answer "Y" (yes) to all questions.

```bash
sudo mysql_secure_installation
```

### 1.3. Create a Database and User

Log in to the MySQL shell:

```bash
sudo mysql
```

Create a new database and user for your application. Replace `your_password` with a strong password.

```sql
CREATE DATABASE eventz_db;
CREATE USER 'eventz_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON eventz_db.* TO 'eventz_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 2. Backend Setup

Next, you'll configure and run the Node.js backend server.

### 2.1. Clone the Repository

Clone your project repository to the droplet:

```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### 2.2. Install Node.js and npm

If you don't have Node.js and npm installed, you can install them using NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2.3. Install Backend Dependencies

Navigate to the `server` directory and install the dependencies:

```bash
cd server
npm install
```

### 2.4. Create the Environment File

Create a `.env` file in the `server` directory with the following content. Replace the placeholder values with your actual database credentials.

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=eventz_user
DB_PASSWORD=your_password
DB_NAME=eventz_db
```

### 2.5. Run the Backend with a Process Manager (PM2)

PM2 is a process manager that will keep your Node.js application running in the background.

Install PM2:

```bash
sudo npm install -g pm2
```

Start the server with PM2:

```bash
pm2 start index.js --name "eventz-backend"
```

Ensure PM2 starts on system reboot:

```bash
pm2 startup
```

Follow the on-screen instructions, which will provide a command to run.

## 3. Frontend Setup

Now, you'll build the React frontend.

### 3.1. Install Frontend Dependencies

Navigate to the root of your project and install the dependencies:

```bash
cd ..
npm install
```

### 3.2. Build the Frontend

Build the static files for the frontend:

```bash
npm run build
```

This will create a `dist` directory containing the production-ready frontend assets.

## 4. Nginx Configuration

Finally, configure Nginx to serve the frontend and proxy requests to the backend.

### 4.1. Create a New Nginx Configuration File

Create a new Nginx server block configuration file. Replace `your_domain` with your actual domain name or your droplet's IP address.

```bash
sudo nano /etc/nginx/sites-available/your_domain
```

### 4.2. Add the Nginx Configuration

Paste the following configuration into the file. Be sure to replace `your_domain` and set the `root` path to the `dist` directory of your project.

```nginx
server {
    listen 80;
    server_name your_domain www.your_domain;

    root /path/to/your/project/dist;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api/ {
        proxy_pass http://localhost:3000; # Assuming your backend runs on port 3000
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3. Enable the Nginx Configuration

Create a symbolic link to enable the new configuration:

```bash
sudo ln -s /etc/nginx/sites-available/your_domain /etc/nginx/sites-enabled/
```

### 4.4. Test and Restart Nginx

Test your Nginx configuration for syntax errors:

```bash
sudo nginx -t
```

If the test is successful, restart Nginx to apply the changes:

```bash
sudo systemctl restart nginx
```

Your application should now be live at your domain or IP address.