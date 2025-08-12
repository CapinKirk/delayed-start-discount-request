# Tech Context: Delayed Start Discount Request

## Technology Stack

### Core Platform
- **Google Apps Script**: Backend runtime and deployment platform
- **HTML5/CSS3/JavaScript**: Frontend interface
- **Google Sheets**: Data storage and management

### External Integrations
- **Slack API**: Approval workflow and notifications
- **Google Workspace APIs**: Sheet operations and user management

### Development Tools
- **Google Apps Script Editor**: Code development and testing
- **Google Sheets**: Data structure and testing
- **Slack App Configuration**: API setup and testing

## Development Setup

### Prerequisites
1. **Google Workspace Account**: Access to Apps Script and Sheets
2. **Slack Workspace**: Admin access for app creation
3. **Spreadsheet Access**: Read/write access to required sheets

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

### Slack App Configuration
- **Bot Token**: Stored in Script Properties as `SLACK_BOT_TOKEN`
- **Required Scopes**: `chat:write`, `conversations.open`
- **Optional Scopes**: `chat:update`, `users:read.email`
- **Interactivity**: Enabled with Web App URL as request URL

## Technical Constraints

### Google Apps Script Limits
- **Execution Time**: 6 minutes maximum per function
- **Memory**: 50MB heap size limit
- **API Calls**: 100,000 calls per day
- **Sheet Operations**: 10,000 rows per operation

### Slack API Limits
- **Rate Limiting**: 50 requests per second
- **Message Size**: 40,000 characters maximum
- **Interactive Components**: 5 buttons per message maximum

### Browser Compatibility
- **Target**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **JavaScript**: ES6+ features supported
- **CSS**: Flexbox and Grid layout support

## Dependencies

### Google Apps Script Services
- **SpreadsheetApp**: Sheet operations and data access
- **Session**: User authentication and email retrieval
- **PropertiesService**: Configuration storage
- **UrlFetchApp**: External API calls to Slack
- **CacheService**: Data caching for performance

### External Libraries
- **None Required**: Pure Apps Script implementation
- **Optional**: Custom utility functions for common operations

### Data Format Requirements
- **CSV-like**: Tabular data with specific header requirements
- **JSON**: API responses and configuration data
- **Date Formats**: ISO 8601 (yyyy-MM-dd) for consistency

## Deployment Configuration

### Web App Settings
- **Execute As**: Me (script owner)
- **Access**: Anyone in domain (or Anyone with link per policy)
- **Version**: New version for each deployment

### Script Properties
- `SLACK_BOT_TOKEN`: Slack bot user OAuth token
- `PROJECTS_SHEET_ID`: Projects spreadsheet ID
- `DIRECTORY_SHEET_ID`: Directory spreadsheet ID
- `REQUESTS_SHEET_ID`: Requests spreadsheet ID

### Environment Variables
- **Development**: Test spreadsheets and Slack channels
- **Production**: Live data sources and production Slack workspace
- **Configuration**: Environment-specific property values

## Performance Considerations

### Caching Strategy
- **Account/Opportunity Lists**: Cache for session duration
- **Project Details**: Cache for 5 minutes
- **Directory Data**: Cache for 1 hour
- **Slack User Lookups**: Cache for 24 hours

### Optimization Techniques
- **Batch Operations**: Group sheet operations where possible
- **Lazy Loading**: Load data only when needed
- **Connection Pooling**: Reuse HTTP connections to Slack
- **Error Handling**: Graceful degradation for non-critical failures

## Security Requirements

### Authentication
- **Google Workspace**: Automatic user authentication
- **Session Validation**: Verify user email and domain access
- **Request Logging**: Log all operations with user context

### Data Protection
- **Sensitive Data**: No PII stored in logs
- **API Keys**: Stored in Script Properties only
- **Access Control**: Domain-restricted access
- **Audit Trail**: Complete request and approval history

### API Security
- **Request Validation**: Sanitize all user inputs
- **Rate Limiting**: Prevent abuse of external APIs
- **Error Handling**: No sensitive information in error messages
