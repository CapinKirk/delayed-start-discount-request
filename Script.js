/**
 * Delayed Start Discount Request - Frontend JavaScript
 * 
 * This script handles the user interface logic, including:
 * - Cascading dropdowns for Account → Opportunity → Project
 * - Form validation and error handling
 * - API calls to Google Apps Script backend
 * - Dynamic UI updates and state management
 */

// Global state
let currentState = {
    accounts: [],
    opportunities: [],
    projects: [],
    selectedAccount: '',
    selectedOpportunity: '',
    selectedProject: '',
    projectDetails: null
};

// Celebration GIFs (hardcoded as specified)
const CELEBRATION_GIFS = [
    'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
    'https://media.giphy.com/media/26u4cqi2I30juCOGY/giphy.gif',
    'https://media.giphy.com/media/l0HlvtIPzvv2h3mDu/giphy.gif',
    'https://media.giphy.com/media/3o7TKDEqX6bMpIhASQ/giphy.gif',
    'https://media.giphy.com/media/26tPbhZH3ZvmesIfW/giphy.gif'
];

// DOM elements
const elements = {
    accountSelect: null,
    opportunitySelect: null,
    projectSelect: null,
    projectDetails: null,
    justificationSection: null,
    submitSection: null,
    mainForm: null,
    thankYouPage: null,
    loadingOverlay: null,
    errorBanner: null,
    errorMessage: null,
    submitBtn: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    loadAccounts();
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
    elements.accountSelect = document.getElementById('accountSelect');
    elements.opportunitySelect = document.getElementById('opportunitySelect');
    elements.projectSelect = document.getElementById('projectSelect');
    elements.projectDetails = document.getElementById('projectDetails');
    elements.justificationSection = document.getElementById('justificationSection');
    elements.submitSection = document.getElementById('submitSection');
    elements.mainForm = document.getElementById('mainForm');
    elements.thankYouPage = document.getElementById('thankYouPage');
    elements.loadingOverlay = document.getElementById('loadingOverlay');
    elements.errorBanner = document.getElementById('errorBanner');
    elements.errorMessage = document.getElementById('errorMessage');
    elements.submitBtn = document.getElementById('submitBtn');
}

/**
 * Setup event listeners for form interactions
 */
function setupEventListeners() {
    // Account selection change
    elements.accountSelect.addEventListener('change', handleAccountChange);
    
    // Opportunity selection change
    elements.opportunitySelect.addEventListener('change', handleOpportunityChange);
    
    // Project selection change
    elements.projectSelect.addEventListener('change', handleProjectChange);
    
    // Form submission
    document.getElementById('discountForm').addEventListener('submit', handleFormSubmit);
    
    // Input validation on blur
    document.getElementById('notes').addEventListener('blur', validateField);
    document.getElementById('lessonsLearned').addEventListener('blur', validateField);
    document.getElementById('delayEndDate').addEventListener('blur', validateField);
}

/**
 * Load accounts from the backend
 */
async function loadAccounts() {
    try {
        showLoading('Loading accounts...');
        
        const accounts = await google.script.run
            .withSuccessHandler(onAccountsLoaded)
            .withFailureHandler(onError)
            .getAccounts();
            
    } catch (error) {
        onError(error);
    }
}

/**
 * Handle successful accounts loading
 */
function onAccountsLoaded(accounts) {
    hideLoading();
    
    if (!accounts || accounts.length === 0) {
        showError('No accounts found. Please check the Projects sheet configuration.');
        return;
    }
    
    currentState.accounts = accounts;
    populateAccountDropdown(accounts);
}

/**
 * Populate the account dropdown
 */
function populateAccountDropdown(accounts) {
    elements.accountSelect.innerHTML = '<option value="">Select an Account</option>';
    
    accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account;
        option.textContent = account;
        elements.accountSelect.appendChild(option);
    });
    
    elements.accountSelect.disabled = false;
}

/**
 * Handle account selection change
 */
async function handleAccountChange() {
    const selectedAccount = elements.accountSelect.value;
    
    if (!selectedAccount) {
        resetOpportunities();
        resetProjects();
        return;
    }
    
    currentState.selectedAccount = selectedAccount;
    
    try {
        showLoading('Loading opportunities...');
        
        const opportunities = await google.script.run
            .withSuccessHandler(onOpportunitiesLoaded)
            .withFailureHandler(onError)
            .getOppData(selectedAccount);
            
    } catch (error) {
        onError(error);
    }
}

/**
 * Handle successful opportunities loading
 */
function onOpportunitiesLoaded(opportunities) {
    hideLoading();
    
    if (!opportunities || opportunities.length === 0) {
        showError('No opportunities found for the selected account.');
        return;
    }
    
    currentState.opportunities = opportunities;
    populateOpportunityDropdown(opportunities);
}

/**
 * Populate the opportunity dropdown
 */
function populateOpportunityDropdown(opportunities) {
    elements.opportunitySelect.innerHTML = '<option value="">Select an Opportunity</option>';
    
    opportunities.forEach(opportunity => {
        const option = document.createElement('option');
        option.value = opportunity;
        option.textContent = opportunity;
        elements.opportunitySelect.appendChild(option);
    });
    
    elements.opportunitySelect.disabled = false;
    resetProjects();
}

/**
 * Handle opportunity selection change
 */
async function handleOpportunityChange() {
    const selectedOpportunity = elements.opportunitySelect.value;
    
    if (!selectedOpportunity) {
        resetProjects();
        return;
    }
    
    currentState.selectedOpportunity = selectedOpportunity;
    
    try {
        showLoading('Loading projects...');
        
        const projects = await google.script.run
            .withSuccessHandler(onProjectsLoaded)
            .withFailureHandler(onError)
            .getProjectData(currentState.selectedAccount, selectedOpportunity);
            
    } catch (error) {
        onError(error);
    }
}

/**
 * Handle successful projects loading
 */
function onProjectsLoaded(projects) {
    hideLoading();
    
    if (!projects || projects.length === 0) {
        showError('No projects found for the selected opportunity.');
        return;
    }
    
    currentState.projects = projects;
    populateProjectDropdown(projects);
}

/**
 * Populate the project dropdown
 */
function populateProjectDropdown(projects) {
    elements.projectSelect.innerHTML = '<option value="">Select a Project</option>';
    
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
        option.textContent = project;
        elements.projectSelect.appendChild(option);
    });
    
    elements.projectSelect.disabled = false;
}

/**
 * Handle project selection change
 */
async function handleProjectChange() {
    const selectedProject = elements.projectSelect.value;
    
    if (!selectedProject) {
        hideProjectDetails();
        return;
    }
    
    currentState.selectedProject = selectedProject;
    
    try {
        showLoading('Loading project details...');
        
        const projectDetails = await google.script.run
            .withSuccessHandler(onProjectDetailsLoaded)
            .withFailureHandler(onError)
            .getProjectDetails(selectedProject);
            
    } catch (error) {
        onError(error);
    }
}

/**
 * Handle successful project details loading
 */
function onProjectDetailsLoaded(projectDetails) {
    hideLoading();
    
    if (!projectDetails) {
        showError('Failed to load project details.');
        return;
    }
    
    currentState.projectDetails = projectDetails;
    displayProjectDetails(projectDetails);
    showJustificationSection();
}

/**
 * Display project details in the UI
 */
function displayProjectDetails(details) {
    // Update project detail fields
    document.getElementById('aeName').textContent = details.aeName || '-';
    document.getElementById('projectManager').textContent = details.projectManagerName || '-';
    document.getElementById('contractStart').textContent = formatDate(details.contractStartDate) || '-';
    document.getElementById('goLive').textContent = formatDate(details.plannedGoLive) || '-';
    document.getElementById('currentACV').textContent = details.currentACV || '-';
    document.getElementById('hoursBudgeted').textContent = details.hoursForecast || '-';
    document.getElementById('hoursDelivered').textContent = details.hoursCompleted || '-';
    
    // Show project details section
    elements.projectDetails.style.display = 'block';
}

/**
 * Show the justification section
 */
function showJustificationSection() {
    elements.justificationSection.style.display = 'block';
    elements.submitSection.style.display = 'block';
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    try {
        showLoading('Submitting request...');
        
        const formData = {
            accountName: currentState.selectedAccount,
            opportunityName: currentState.selectedOpportunity,
            projectName: currentState.selectedProject,
            notes: document.getElementById('notes').value.trim(),
            lessonsLearned: document.getElementById('lessonsLearned').value.trim(),
            delayEndDate: document.getElementById('delayEndDate').value
        };
        
        const result = await google.script.run
            .withSuccessHandler(onRequestSubmitted)
            .withFailureHandler(onError)
            .submitRequest(formData);
            
    } catch (error) {
        onError(error);
    }
}

/**
 * Handle successful request submission
 */
function onRequestSubmitted(result) {
    hideLoading();
    
    if (result.success) {
        showThankYouPage();
    } else {
        showError(result.message || 'Failed to submit request.');
    }
}

/**
 * Show the thank you page
 */
function showThankYouPage() {
    elements.mainForm.style.display = 'none';
    elements.thankYouPage.style.display = 'block';
    
    // Set random celebration GIF
    const randomGif = CELEBRATION_GIFS[Math.floor(Math.random() * CELEBRATION_GIFS.length)];
    document.getElementById('randomGif').src = randomGif;
}

/**
 * Reset the form to start over
 */
function resetForm() {
    // Reset form state
    currentState = {
        accounts: [],
        opportunities: [],
        projects: [],
        selectedAccount: '',
        selectedOpportunity: '',
        selectedProject: '',
        projectDetails: null
    };
    
    // Reset form elements
    document.getElementById('discountForm').reset();
    
    // Reset dropdowns
    resetOpportunities();
    resetProjects();
    
    // Hide sections
    hideProjectDetails();
    elements.justificationSection.style.display = 'none';
    elements.submitSection.style.display = 'none';
    
    // Show main form
    elements.thankYouPage.style.display = 'none';
    elements.mainForm.style.display = 'block';
    
    // Reload accounts
    loadAccounts();
}

/**
 * Reset opportunities dropdown
 */
function resetOpportunities() {
    elements.opportunitySelect.innerHTML = '<option value="">Select an Opportunity</option>';
    elements.opportunitySelect.disabled = true;
    currentState.opportunities = [];
    currentState.selectedOpportunity = '';
}

/**
 * Reset projects dropdown
 */
function resetProjects() {
    elements.projectSelect.innerHTML = '<option value="">Select a Project</option>';
    elements.projectSelect.disabled = true;
    currentState.projects = [];
    currentState.selectedProject = '';
}

/**
 * Hide project details section
 */
function hideProjectDetails() {
    elements.projectDetails.style.display = 'none';
    currentState.projectDetails = null;
}

/**
 * Validate the entire form
 */
function validateForm() {
    let isValid = true;
    
    // Validate required fields
    const requiredFields = ['notes', 'lessonsLearned', 'delayEndDate'];
    
    requiredFields.forEach(fieldId => {
        if (!validateField(fieldId)) {
            isValid = false;
        }
    });
    
    // Validate project selection
    if (!currentState.selectedProject) {
        showFieldError('projectSelect', 'Please select a project');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Validate a specific field
 */
function validateField(fieldId) {
    const field = document.getElementById(fieldId);
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    
    if (isRequired && !value) {
        showFieldError(fieldId, 'This field is required');
        return false;
    }
    
    // Clear any existing error
    clearFieldError(fieldId);
    return true;
}

/**
 * Show field-specific error message
 */
function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * Clear field-specific error message
 */
function clearFieldError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

/**
 * Show loading overlay
 */
function showLoading(message = 'Loading...') {
    elements.loadingOverlay.style.display = 'flex';
    elements.loadingOverlay.querySelector('p').textContent = message;
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

/**
 * Show error banner
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorBanner.style.display = 'block';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        hideErrorBanner();
    }, 10000);
}

/**
 * Hide error banner
 */
function hideErrorBanner() {
    elements.errorBanner.style.display = 'none';
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toISOString().split('T')[0]; // yyyy-MM-dd format
    } catch (error) {
        return dateString;
    }
}

/**
 * Global error handler
 */
function onError(error) {
    hideLoading();
    console.error('Application error:', error);
    
    let errorMessage = 'An unexpected error occurred.';
    
    if (typeof error === 'string') {
        errorMessage = error;
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    showError(errorMessage);
}

/**
 * Utility function to check if element exists
 */
function elementExists(id) {
    return document.getElementById(id) !== null;
}

/**
 * Utility function to safely get element
 */
function getElement(id) {
    return document.getElementById(id) || null;
}

/**
 * Utility function to safely set element text
 */
function setElementText(id, text) {
    const element = getElement(id);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Utility function to safely set element HTML
 */
function setElementHTML(id, html) {
    const element = getElement(id);
    if (element) {
        element.innerHTML = html;
    }
}

/**
 * Utility function to safely show/hide element
 */
function toggleElement(id, show) {
    const element = getElement(id);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

// Export functions for global access (if needed)
window.DelayedStartDiscountRequest = {
    resetForm,
    hideErrorBanner
};
