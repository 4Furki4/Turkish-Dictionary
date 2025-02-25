# Turkish Dictionary

## Project Aim

- The world and languages we use to understand the world are always changing, especially in the modern world. My goal is to create an engaging, non-native speaker-friendly, and up-to-date Turkish dictionary, by also consulting with experts in fields such as science.
- I'll follow the dictionary book that's been used in the [Official Turkish Dictionary](https://sozluk.gov.tr)

## Feature Roadmap

Current and planned features:

- Minigames to learn or practice Turkish words and grammar
  - Randomized letter puzzles to find words
  - More games coming soon!
- Community contributions
  - Word pronunciations
  - Missing word requests
  - Word change suggestions
  - Visual aids and images for words and meanings
- Personal learning tools
  - Save words for later
  - Flashcard creation system
  - Quick integration of saved words into learning cards
- User feedback system
  - Easy feature requests
  - Intuitive feedback submission
- Visual learning support
  - Images for words to enhance understanding
  - Visual context for different word meanings
  - User-contributed image suggestions

## Tech Stack

### Core Technologies

- **Frontend & Backend**
  - Next.js (App Router) with React 18
  - create-t3-app stack
  - tRPC for type-safe API
  - NextUI for modern UI components
  - next-intl for internationalization

### Database & Authentication

- PostgreSQL database
- NextAuth for authentication
  - Multiple OAuth providers (Google, GitHub, Discord)

### Additional Features

- Nodemailer for email functionality
- Uploadthing for file uploads
- React Hook Form for form handling
- Docker support for development environment

## Getting Started

### Prerequisites

- Node.js
- Docker and Docker Compose (for local development)
- PostgreSQL (automatically handled by Docker)

### Development Setup

1. Clone the repository
2. Copy the `.env.example` file to `.env` and fill in the required variables
3. Start the development environment:

   ```bash
   docker-compose up -d    # Starts PostgreSQL database
   npm install            # Install dependencies
   npm run dev           # Start development server
   ```

### Environment Variables

```env
# Database
DATABASE_URL=              # PostgreSQL connection URL

# Authentication
NEXTAUTH_SECRET=          # See https://next-auth.js.org/configuration/options#secret
NEXTAUTH_URL=             # http://localhost:3000 for local development

# OAuth Providers
AUTH_DISCORD_ID=
AUTH_DISCORD_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Login via Email (Magic Link)
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_FROM=

# File Upload
UPLOADTHING_SECRET=       # From uploadthing.com

# Email
NODEMAIL_PASSWORD=
NODEMAIL_EMAIL=
```

## Contributing

We welcome contributions! Please check our issues page for current tasks or bug reports. A detailed contribution guide will be added soon.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

MIT License means:

- ✓ Commercial use
- ✓ Modification
- ✓ Distribution
- ✓ Private use
- ✓ Liability and warranty limitations
