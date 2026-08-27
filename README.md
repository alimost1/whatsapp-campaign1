# Map-Com Clean - WhatsApp Campaign Manager

A modern, full-stack WhatsApp campaign management application built with React, Node.js, TypeScript, and Evolution API v2.

## ✨ Features

- 🔐 **Authentication** - JWT-based auth with role-based access control
- 📞 **Contact Management** - Import, export, and manage your contacts
- 📬 **Campaigns** - Create and manage WhatsApp marketing campaigns
- 🎨 **Templates** - Reusable message templates with variables
- 🚀 **Anti-Spam** - Built-in rate limiting and spam prevention
- 📊 **Analytics** - Track campaign performance and message delivery
- 📱 **Responsive** - Works on desktop and mobile devices
- 🔒 **Secure** - Input validation, file upload restrictions, and security headers

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **Zustand** for state management
- **React Router** for navigation
- **Lucide Icons** for beautiful icons

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma ORM** with SQLite
- **JWT** authentication
- **Multer** for file uploads
- **Evolution API v2** integration
- **Express Validator** for input validation

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Evolution API v2 instance (optional for WhatsApp features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/alimost1/whatsapp-campaign1.git
cd whatsapp-campaign1
```

2. **Install all dependencies**
```bash
npm run install:all
```

3. **Set up environment variables**

Backend (create `backend/.env`):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3001
NODE_ENV=development

# Evolution API Configuration
EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY="your-evolution-api-key"
EVOLUTION_INSTANCE_NAME="map-com-instance"

# File Upload Configuration
UPLOAD_DIR="./uploads"
DATA_DIR="./data"
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Anti-Spam Configuration
MAX_MESSAGES_PER_MINUTE=10
MAX_MESSAGES_PER_HOUR=100
```

Frontend (create `frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```

4. **Initialize the database**
```bash
cd backend
npx prisma generate
npx prisma migrate dev
cd ..
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 📁 Project Structure

```
whatsapp-campaign1/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express app entry point
│   │   ├── routes/           # API route handlers
│   │   ├── middleware/       # Auth, upload, error handling
│   │   ├── services/         # Business logic
│   │   └── utils/            # Helper functions
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── uploads/              # User uploaded files
│   ├── data/                 # Application data
│   ├── .env.example          # Environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── store/            # Zustand state management
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions
│   │   ├── types/            # TypeScript types
│   │   └── api/              # API client
│   ├── .env.example          # Environment template
│   └── package.json
├── .gitignore
├── package.json              # Root package.json
└── README.md
```

## 📖 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Contacts
- `GET /api/contacts` - List all contacts
- `POST /api/contacts` - Create contact
- `GET /api/contacts/:id` - Get contact by ID
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Messages
- `GET /api/messages` - List all messages
- `POST /api/messages` - Send message
- `GET /api/messages/:id` - Get message details
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

### Templates (Admin)
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Uploads
- `POST /api/uploads` - Upload file
- `GET /api/uploads` - List uploaded files
- `DELETE /api/uploads/:filename` - Delete file

## 🔒 Security Best Practices

1. **Never commit sensitive files**
   - `.env` files
   - Database files (`*.db`)
   - Uploaded files with sensitive data

2. **Change default secrets**
   - Update `JWT_SECRET` in production
   - Use strong, unique passwords

3. **Use HTTPS in production**
   - Always use HTTPS for API calls
   - Configure proper SSL certificates

4. **Rate limiting**
   - Adjust limits based on your needs
   - Monitor for abuse

5. **Input validation**
   - All inputs are validated on the backend
   - File uploads are restricted to safe types

## 🚢 Deployment

### Production Build

```bash
# Build both frontend and backend
npm run build

# Start the backend (serves both API and static files)
npm start
```

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start backend/dist/index.js --name map-com

# View logs
pm2 logs map-com

# Monitor
pm2 monit
```

### Environment Variables for Production

```env
NODE_ENV=production
JWT_SECRET=your-production-secret-key
DATABASE_URL=file:./prod.db
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-api-key
FRONTEND_URL=https://your-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [Evolution API](https://github.com/EvolutionAPI/evolution-api) - WhatsApp API
- [Prisma](https://www.prisma.io/) - Database ORM
- [Vite](https://vitejs.dev/) - Frontend build tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - UI components inspiration

---

Built with ❤️ using React, Node.js, and TypeScript
