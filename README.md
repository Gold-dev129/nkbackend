# NKYLUXURY Backend Server

This is the production-ready Node.js & Express.js REST API backend server for NKYLUXURY, an exquisite luxury jewelry brand eCommerce application.

## Tech Stack
- **Node.js & Express.js** - Server engine and REST API router.
- **MongoDB & Mongoose** - Database modeling and data persistence.
- **JWT & bcryptjs** - Authentication token signatures and password hashing.
- **Multer & Cloudinary** - Handling multipart buffer image streams and uploads.
- **Nodemailer** - Delivering customer transactional welcome/order/reset emails.
- **Helmet, CORS, Rate-Limiting** - Security configurations for endpoints.

---

## Environmental Config Checklist
Create a `.env` file in this directory based on the `.env.example` file:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB Connection String (Atlas or Local)
MONGO_URI=mongodb+srv://...

# JWT Token configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# Cloudinary Storage credentials
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email setup details (Nodemailer, e.g., Mailtrap or SMTP Server)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_email_username
EMAIL_PASS=your_email_password
EMAIL_FROM=NKYLUXURY <noreply@nkyluxury.com>
```

---

## Local Setup
1. Open your terminal in the backend directory.
2. Install the node modules:
   ```bash
   npm install
   ```
3. Run the development server (runs with nodemon hot-reload):
   ```bash
   npm run dev
   ```
4. Verify by navigating to `http://localhost:5000/api/health`.

---

## Production Deployment (Render or Railway)
### Render:
1. Create a new **Web Service** on Render.
2. Connect your GitHub repository containing the backend code.
3. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, add all the config keys listed in the configuration section above.

### Railway:
1. Create a new project on Railway.
2. Deploy from GitHub repository.
3. Add environment variables in the **Variables** dashboard tab.
4. Railway will automatically build and start the service based on `package.json` configurations.
