# System Patterns: Delayed Start Discount Request

## Architecture Overview

### System Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web App UI   │    │  Google Apps     │    │   External      │
│   (HTML/CSS/JS)│◄──►│  Script Backend  │◄──►│   Services      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Google Sheets   │
                       │  (Data Storage)  │
                       └──────────────────┘
```

### Data Flow Architecture
1. **UI Layer**: Cascading dropdowns with client-side validation
2. **Backend Layer**: Apps Script functions for data retrieval and processing
3. **Data Layer**: Google Sheets for Projects, Directory, and Requests
4. **Integration Layer**: Slack API for approval workflow and notifications

## Key Technical Decisions

### 1. Google Apps Script as Backend
- **Rationale**: Native Google Workspace integration, built-in authentication
- **Benefits**: No external hosting, automatic scaling, familiar environment
- **Constraints**: Execution time limits, memory constraints

### 2. Sheet-Based Data Storage
- **Projects Sheet**: Read-only CRM data source
- **Directory Sheet**: Employee hierarchy and Slack mapping
- **Requests Sheet**: Request tracking and audit trail
- **PendingApprovals Sheet**: Active approval workflow state

### 3. Slack Integration Pattern
- **Approval Flow**: Manager chain traversal with interactive buttons
- **Notification System**: Direct messages for approvals and reminders
- **State Management**: Persistent tracking of approval progress

### 4. Cascading Dropdown Pattern
- **Account Selection**: Loads all available accounts
- **Opportunity Filtering**: Filters by selected account
- **Project Filtering**: Filters by account + opportunity
- **Data Loading**: Progressive disclosure with loading states

## Design Patterns

### 1. Repository Pattern
- Separate functions for each data source
- Consistent error handling and data formatting
- Caching strategies for frequently accessed data

### 2. State Machine Pattern
- Request states: PENDING → APPROVED/REJECTED
- Approval chain progression with timeout handling
- Automatic state transitions based on business rules

### 3. Observer Pattern
- Slack message updates based on approval actions
- Email notifications for status changes
- Real-time status updates in the system

### 4. Factory Pattern
- Dynamic approval chain building
- Message template generation
- Error response formatting

## Component Relationships

### Core Functions
```
doGet() → Index.html
    ↓
getAccounts() → getOppData() → getProjectData()
    ↓
getProjectDetails() → submitRequest()
    ↓
setupApprovalSystem() → Slack Workflow
```

### Data Dependencies
- **Projects** → **Requests** (one-to-many)
- **Directory** → **PendingApprovals** (hierarchy mapping)
- **Requests** → **PendingApprovals** (status tracking)

## Error Handling Strategy

### 1. Graceful Degradation
- Fallback to email when Slack unavailable
- Default values for missing data
- User-friendly error messages

### 2. Retry Logic
- Slack API call retries with exponential backoff
- Sheet operation retries for transient failures
- Approval reminder retry mechanisms

### 3. Logging and Monitoring
- Stackdriver logging for all operations
- Error categorization and alerting
- Performance metrics tracking

## Security Considerations

### 1. Authentication
- Google Apps Script session management
- Domain-restricted access control
- User email validation and logging

### 2. Data Access
- Read-only access to Projects sheet
- Controlled access to Directory data
- Audit trail for all request modifications

### 3. API Security
- Slack token storage in Script Properties
- Request validation and sanitization
- Rate limiting for external API calls
