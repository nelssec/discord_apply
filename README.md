# Discord Guild Application Bot

A Discord bot and web dashboard for managing guild applications with customizable forms, ticket-based review, and role management.

## Features

- **Multiple Application Forms**: Create different forms for staff, members, etc.
- **Discord Modals**: Clean, native Discord UI for filling out applications
- **Ticket System**: Private channels for applicant-staff communication
- **Role Management**: Auto-assign roles on accept/deny
- **Web Dashboard**: Manage forms and review applications via browser
- **Discord OAuth2**: Secure login using Discord accounts

## Prerequisites

- Node.js 18+
- A Discord application with bot enabled

## Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to **Bot** tab and create a bot
4. Copy the bot token
5. Go to **OAuth2** tab
6. Copy the Client ID and Client Secret
7. Add redirect URI: `http://localhost:3000/api/auth/callback/discord`

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_32_char_string_here

DATABASE_PATH=../data/guild_apps.db
```

Generate NEXTAUTH_SECRET with:
```bash
openssl rand -base64 32
```

### 3. Install Dependencies

```bash
cd bot && npm install
cd ../web && npm install
```

### 4. Deploy Bot Commands

```bash
cd bot && npm run deploy
```

### 5. Start the Bot

```bash
cd bot && npm run dev
```

### 6. Start the Web Dashboard

```bash
cd web && npm run dev
```

### 7. Invite Bot to Server

Use this URL (replace CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

## Usage

### Creating a Form

1. Log in to the web dashboard
2. Select your server
3. Go to Forms > Create Form
4. Add questions (max 5 per form due to Discord modal limits)
5. Configure settings (channels, roles, messages)

### Applying

Users can apply via:
- `/apply` command in Discord
- Clicking an Apply button (if you've posted one)

### Reviewing Applications

**In Discord:**
- Applications are posted to the log channel
- Click Accept/Deny/Message buttons
- Optional: Use ticket channels for discussion

**In Web Dashboard:**
- Go to Applications
- Click on an application to view details
- Accept or deny with optional reason

## Bot Commands

| Command | Description |
|---------|-------------|
| `/apply [form]` | Open application form |

## Project Structure

```
discord_apply/
├── bot/                  # Discord bot
│   └── src/
│       ├── commands/     # Slash commands
│       ├── events/       # Event handlers
│       ├── handlers/     # Button/modal handlers
│       └── utils/        # Utilities
├── web/                  # Next.js dashboard
│   └── src/
│       ├── app/          # Pages and API routes
│       ├── components/   # React components
│       └── lib/          # Utilities
├── shared/               # Shared code
│   ├── types.ts          # TypeScript types
│   └── schema.sql        # Database schema
└── data/                 # SQLite database
```

## Database

Uses SQLite stored in `data/guild_apps.db`. Tables:
- `guilds` - Server configuration
- `forms` - Application forms
- `questions` - Form questions
- `applications` - Submitted applications
- `user_sessions` - Web sessions

## Security

- Discord OAuth2 for authentication
- Per-guild permission checks
- Manager role verification
- No password storage
