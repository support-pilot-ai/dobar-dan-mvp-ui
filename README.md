# ChatGPT Clone

A modern chat application built with Next.js, featuring a ChatGPT-like interface with authentication, document management, and references.

## Features

- **Authentication**: Secure login and registration system
- **Chat Interface**: Clean, responsive chat UI with message history
- **Sidebar Navigation**: Organized tabs for chats, documents, and references
- **User Settings**: Comprehensive settings page with profile, notifications, appearance, and security options
- **Document Management**: Upload and manage documents
- **References**: Quick access to guides and documentation

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Authentication**: JWT-based auth with localStorage
- **API Integration**: RESTful API with fetch

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running (see API Configuration below)

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a `.env.local` file based on `.env.local.example`:
   \`\`\`bash
   cp .env.local.example .env.local
   \`\`\`

4. Update the `NEXT_PUBLIC_API_URL` in `.env.local` with your backend API URL

5. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Configuration

The application expects a backend API with the following endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Chat
- `POST /api/chat/message` - Send a message
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/sessions` - Get chat sessions

### Documents
- `GET /api/documents` - Get user documents
- `POST /api/documents/upload` - Upload a document

### User Profile
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

All authenticated endpoints require a Bearer token in the Authorization header.

## Project Structure

\`\`\`
├── app/
│   ├── chat/          # Main chat interface
│   ├── login/         # Login page
│   ├── register/      # Registration page
│   ├── settings/      # Settings page
│   └── page.tsx       # Home page (redirects to chat or login)
├── components/
│   ├── ui/            # shadcn/ui components
│   └── chat-sidebar.tsx  # Chat sidebar component
├── lib/
│   ├── api.ts         # API integration functions
│   ├── auth.ts        # Authentication utilities
│   └── utils.ts       # Utility functions
└── public/            # Static assets
\`\`\`

## Features in Detail

### Authentication
- Secure JWT-based authentication
- Token stored in localStorage
- Automatic redirect to login if not authenticated
- Protected routes

### Chat Interface
- Real-time message display
- User and AI message differentiation
- Loading states with animated dots
- Auto-scroll to latest message
- Enter to send, Shift+Enter for new line

### Sidebar
- **Chats Tab**: View conversation history
- **Docs Tab**: Upload and manage documents
- **Refs Tab**: Quick access to references and guides

### Settings
- **Profile**: Update name and email
- **Notifications**: Configure push and email notifications
- **Appearance**: Choose light, dark, or system theme
- **Security**: Change password and account deletion

## Customization

### Theming
The app uses a ChatGPT-inspired teal color scheme. To customize:
1. Edit `app/globals.css`
2. Update the CSS variables in `:root` and `.dark`

### API URL
Update `NEXT_PUBLIC_API_URL` in `.env.local` to point to your backend

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
4. Deploy

## License

MIT
