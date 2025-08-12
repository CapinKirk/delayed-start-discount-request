# Delayed Start Discount Request System

A modern web application for submitting delayed start discount requests through a structured Slack-based approval workflow. Built with Node.js, Express, React, and modern web technologies.

## 🚀 Features

- **Modern Web Interface**: React-based SPA with responsive design
- **Cascading Dropdowns**: Account → Opportunity → Project selection from live CRM data
- **Auto-population**: Project details automatically filled and locked as read-only
- **Multi-level Approval**: Slack-based workflow through manager hierarchy
- **Automatic Reminders**: 24-hour reminders and 3-business-day auto-approval
- **Data Logging**: Complete audit trail in Google Sheets
- **Point of Rental Branding**: Professional styling with company colors

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js + Express.js
- **Frontend**: React 18 + React Router + React Hook Form
- **Database**: Google Sheets API
- **Integration**: Slack API
- **Deployment**: Vercel
- **Authentication**: JWT-based (configurable)

### System Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │    │  Node.js/Express │    │   External      │
│   (Frontend)    │◄──►│  Backend         │◄──►│   Services      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Google Sheets   │
                       │  (Data Storage)  │
                       └──────────────────┘
```

## 📋 Prerequisites

### Required Access
1. **Google Cloud Platform**: Service account with Sheets API access
2. **Slack Workspace**: Admin access for app creation
3. **GitHub Account**: For source code management
4. **Vercel Account**: For deployment

### Required Spreadsheets
1. **Projects Sheet**: `1EvFncOFIAC378wLKkbbvIT4LP_d9rHcrRz-0pv8Lmkg`
   - Tab: Projects (auto-updated by CRM integration)
   - Access: Read-only

2. **Directory Sheet**: `1HpkqS3tOIlLrX0CG_Sqd_bu3qlReb2gQcxwtdQDsL_8`
   - Tab: Directory (employee hierarchy)
   - Access: Read-only

3. **Requests Sheet**: `1EvFncOFIAC378wLKkbbvIT4LP_d9rHcrRz-0pv8Lmkg`
   - Tab: Requests (created by this app)
   - Access: Read/write

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd delayed-start-discount-request

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Google Sheets API Configuration
GOOGLE_SHEETS_PROJECT_ID=your-google-project-id
GOOGLE_SHEETS_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# Spreadsheet IDs
PROJECTS_SHEET_ID=1EvFncOFIAC378wLKkbbvIT4LP_d9rHcrRz-0pv8Lmkg
DIRECTORY_SHEET_ID=1HpkqS3tOIlLrX0CG_Sqd_bu3qlReb2gQcxwtdQDsL_8
REQUESTS_SHEET_ID=1EvFncOFIAC378wLKkbbvIT4LP_d9rHcrRz-0pv8Lmkg

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_TAYLOR_ID=U07HNSYTE4D

# Security
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here
```

### 3. Development

```bash
# Start backend server (Terminal 1)
npm run dev

# Start frontend development server (Terminal 2)
cd client
npm start
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000
- API Health: http://localhost:3001/health

## 🚀 Deployment to GitHub + Vercel

### 1. GitHub Setup

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Delayed Start Discount Request System"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/delayed-start-discount-request.git
git branch -M main
git push -u origin main
```

### 2. Vercel Deployment

1. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**:
   - Add all variables from your `.env` file
   - Ensure `NODE_ENV=production`

3. **Deploy**:
   - Vercel will automatically detect the Node.js backend
   - Build and deploy the React frontend
   - Your app will be live at `https://your-project.vercel.app`

### 3. Slack App Configuration

1. **Create Slack App**:
   - Go to [Slack API](https://api.slack.com/apps)
   - Create new app from scratch
   - Name: "Delayed Start Discount Request"

2. **Configure Bot Token Scopes**:
   - `chat:write`
   - `conversations.open`
   - `chat:update`
   - `users:read.email`

3. **Set Webhook URLs**:
   - Interactivity: `https://your-project.vercel.app/api/slack/interactive`
   - Events: `https://your-project.vercel.app/api/slack/events`
   - Commands: `https://your-project.vercel.app/api/slack/commands`

4. **Install to Workspace**:
   - Copy the Bot User OAuth Token
   - Add to Vercel environment variables

## 📊 API Reference

### Core Endpoints

#### `GET /api/accounts`
Returns distinct account names from Projects sheet.

#### `GET /api/opportunities`
Returns opportunities for a specific account.

#### `GET /api/projects`
Returns projects for account + opportunity combination.

#### `GET /api/project/:projectName`
Returns detailed project information.

#### `POST /api/submit-request`
Processes and submits a new discount request.

### Slack Endpoints

#### `POST /api/slack/interactive`
Handles Slack interactive components (approval buttons).

#### `POST /api/slack/events`
Handles Slack events (app mentions, etc.).

#### `POST /api/slack/commands`
Handles Slack slash commands.

### Health Checks

#### `GET /health`
Basic health check endpoint.

#### `GET /api/health`
API health check.

#### `GET /api/status`
System status and configuration.

## 🔧 Configuration

### Google Sheets API Setup

1. **Create Service Account**:
   - Go to Google Cloud Console
   - Enable Google Sheets API
   - Create service account
   - Download JSON key file

2. **Share Spreadsheets**:
   - Share all required sheets with service account email
   - Grant appropriate permissions

### Slack App Setup

1. **App Configuration**:
   - Set app name and description
   - Configure bot user display name
   - Set up interactive components

2. **Installation**:
   - Install app to workspace
   - Configure required permissions
   - Test bot functionality

## 🧪 Testing

### Development Testing

```bash
# Backend tests
npm test

# Frontend tests
cd client
npm test

# E2E testing (if configured)
npm run test:e2e
```

### API Testing

```bash
# Test health endpoint
curl https://your-project.vercel.app/health

# Test accounts endpoint
curl https://your-project.vercel.app/api/accounts
```

## 📈 Performance & Monitoring

### Vercel Analytics
- Automatic performance monitoring
- Real-time user analytics
- Error tracking and reporting

### Logging
- Winston-based structured logging
- Error tracking and monitoring
- Performance metrics collection

### Security
- Helmet.js security headers
- Rate limiting and DDoS protection
- Input validation and sanitization
- CORS configuration

## 🔒 Security Considerations

### Environment Variables
- All sensitive data stored in environment variables
- No hardcoded secrets in source code
- Secure storage in Vercel

### API Security
- Rate limiting and throttling
- Input validation and sanitization
- CORS configuration
- Security headers

### Data Protection
- Google Sheets API authentication
- Slack webhook verification
- User input sanitization
- Audit trail logging

## 🚨 Troubleshooting

### Common Issues

#### 1. "Google Sheets API error"
- Verify service account credentials
- Check spreadsheet sharing permissions
- Ensure Google Sheets API is enabled

#### 2. "Slack integration not working"
- Verify bot token and signing secret
- Check webhook URLs in Slack app
- Ensure required scopes are granted

#### 3. "Build failures on Vercel"
- Check environment variables
- Verify Node.js version compatibility
- Review build logs for errors

### Debug Tools

- **Vercel Logs**: View deployment and runtime logs
- **Slack API Tester**: Test Slack integrations
- **Google Sheets API Explorer**: Test sheet operations
- **Browser DevTools**: Frontend debugging

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** feature branch
3. **Implement** changes
4. **Test** thoroughly
5. **Submit** pull request

### Code Standards

- **JavaScript**: ES6+ with consistent formatting
- **React**: Functional components with hooks
- **CSS**: CSS variables and responsive design
- **Node.js**: Async/await with proper error handling

## 📄 License

This project is proprietary software for Point of Rental. All rights reserved.

## 📞 Support

For technical support or questions:
- **Development Team**: Internal development team
- **Documentation**: This README and code comments
- **Issues**: Create issue in GitHub repository

---

**Last Updated**: Initial version
**Version**: 2.0.0
**Status**: Ready for Deployment
**Deployment**: GitHub + Vercel
