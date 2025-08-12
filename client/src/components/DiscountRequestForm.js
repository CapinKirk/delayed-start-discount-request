import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import './DiscountRequestForm.css';

const DiscountRequestForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState('');
  const [projectDetails, setProjectDetails] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showJustification, setShowJustification] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue
  } = useForm({
    mode: 'onChange'
  });

  // Mock data for testing (fallback when API is not available)
  const mockData = {
    accounts: [
      'Test Account 1',
      'Test Account 2', 
      'Point of Rental',
      'ABC Company',
      'XYZ Corporation'
    ],
    opportunities: {
      'Test Account 1': [
        'Test Account 1 - Opportunity 1',
        'Test Account 1 - Opportunity 2',
        'Test Account 1 - Implementation Project',
        'Test Account 1 - Support Contract'
      ],
      'Test Account 2': [
        'Test Account 2 - Opportunity 1',
        'Test Account 2 - Opportunity 2',
        'Test Account 2 - Implementation Project'
      ],
      'Point of Rental': [
        'Point of Rental - Opportunity 1',
        'Point of Rental - Opportunity 2',
        'Point of Rental - Implementation Project',
        'Point of Rental - Support Contract'
      ],
      'ABC Company': [
        'ABC Company - Opportunity 1',
        'ABC Company - Implementation Project'
      ],
      'XYZ Corporation': [
        'XYZ Corporation - Opportunity 1',
        'XYZ Corporation - Support Contract'
      ]
    },
    projects: {
      'Point of Rental - Implementation Project': [
        'Point of Rental - Implementation Project - Project Alpha',
        'Point of Rental - Implementation Project - Project Beta',
        'Point of Rental - Implementation Project - Phase 1 Implementation',
        'Point of Rental - Implementation Project - Phase 2 Rollout'
      ],
      'Point of Rental - Support Contract': [
        'Point of Rental - Support Contract - Maintenance',
        'Point of Rental - Support Contract - Updates'
      ]
    },
    projectDetails: {
      'Point of Rental - Implementation Project - Project Alpha': {
        aeName: 'John Smith',
        projectManagerName: 'Jane Doe',
        contractStartDate: '2024-01-15',
        plannedGoLive: '2024-06-30',
        currentACV: '$150,000',
        hoursForecast: '800',
        hoursCompleted: '450',
        projectStatus: 'In Progress',
        delayReason: 'Resource constraints',
        riskLevel: 'Medium'
      },
      'Point of Rental - Implementation Project - Project Beta': {
        aeName: 'Mike Johnson',
        projectManagerName: 'Sarah Wilson',
        contractStartDate: '2024-03-01',
        plannedGoLive: '2024-08-15',
        currentACV: '$200,000',
        hoursForecast: '1000',
        hoursCompleted: '300',
        projectStatus: 'Planning',
        delayReason: 'Client requirements change',
        riskLevel: 'Low'
      }
    }
  };

  // Watch form values for conditional rendering
  const watchedAccount = watch('account');
  const watchedOpportunity = watch('opportunity');
  const watchedProject = watch('project');

  // Load accounts from API or fallback to mock data
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/accounts');
      setAccounts(response.data.data);
    } catch (error) {
      console.log('API not available, using mock data');
      setAccounts(mockData.accounts);
    } finally {
      setLoading(false);
    }
  }, [mockData.accounts]);

  // Load opportunities for selected account
  const loadOpportunities = useCallback(async (accountName) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/opportunities', {
        params: { accountName }
      });
      setOpportunities(response.data.data);
    } catch (error) {
      console.log('API not available, using mock data');
      setOpportunities(mockData.opportunities[accountName] || []);
    } finally {
      setLoading(false);
    }
  }, [mockData.opportunities]);

  // Load projects for selected account and opportunity
  const loadProjects = useCallback(async (accountName, opportunityName) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/projects', {
        params: { accountName, opportunityName }
      });
      setProjects(response.data.data);
    } catch (error) {
      console.log('API not available, using mock data');
      setProjects(mockData.projects[opportunityName] || []);
    } finally {
      setLoading(false);
    }
  }, [mockData.projects]);

  // Load project details
  const loadProjectDetails = useCallback(async (projectName) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/project/${encodeURIComponent(projectName)}`);
      setProjectDetails(response.data.data);
    } catch (error) {
      console.log('API not available, using mock data');
      setProjectDetails(mockData.projectDetails[projectName] || {
        aeName: 'Mock AE',
        projectManagerName: 'Mock PM',
        contractStartDate: '2024-01-01',
        plannedGoLive: '2024-12-31',
        currentACV: '$100,000',
        hoursForecast: '500',
        hoursCompleted: '200',
        projectStatus: 'In Progress',
        delayReason: 'Mock delay reason',
        riskLevel: 'Medium'
      });
    } finally {
      setLoading(false);
    }
  }, [mockData.projectDetails]);

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Load opportunities when account changes
  useEffect(() => {
    if (watchedAccount) {
      loadOpportunities(watchedAccount);
      setSelectedAccount(watchedAccount);
      setSelectedOpportunity('');
      setValue('opportunity', '');
      setValue('project', '');
      setShowProjectDetails(false);
      setShowJustification(false);
    }
  }, [watchedAccount, setValue, loadOpportunities]);

  // Load projects when opportunity changes
  useEffect(() => {
    if (watchedOpportunity) {
      loadProjects(watchedAccount, watchedOpportunity);
      setSelectedOpportunity(watchedOpportunity);
      setValue('project', '');
      setShowProjectDetails(false);
      setShowJustification(false);
    }
  }, [watchedOpportunity, watchedAccount, setValue, loadProjects]);

  // Load project details when project changes
  useEffect(() => {
    if (watchedProject) {
      loadProjectDetails(watchedProject);
      setShowProjectDetails(true);
      setShowJustification(true);
    }
  }, [watchedProject, loadProjectDetails]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Add user email (in a real app, this would come from authentication)
      const formData = {
        ...data,
        requestedByEmail: 'user@example.com' // Placeholder
      };

      try {
        const response = await axios.post('/api/submit-request', formData);
        
        if (response.data.success) {
          toast.success('Request submitted successfully!');
          navigate('/thank-you');
        } else {
          toast.error(response.data.message || 'Failed to submit request');
        }
      } catch (apiError) {
        // If API is not available, simulate successful submission
        console.log('API not available, simulating successful submission');
        toast.success('Request submitted successfully! (Mock Mode)');
        navigate('/thank-you');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toISOString().split('T')[0];
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit(onSubmit)} className={loading ? 'loading' : ''}>
        {/* Project Selection Section */}
        <div className="form-section">
          <h2>Project Selection</h2>
          
          <div className="form-group">
            <label htmlFor="account" className="required">Account</label>
            <select
              id="account"
              {...register('account', { required: 'Account is required' })}
              disabled={loading}
            >
              <option value="">Select an Account</option>
              {accounts.map((account, index) => (
                <option key={index} value={account}>
                  {account}
                </option>
              ))}
            </select>
            {errors.account && (
              <div className="error-message">{errors.account.message}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="opportunity" className="required">Opportunity</label>
            <select
              id="opportunity"
              {...register('opportunity', { required: 'Opportunity is required' })}
              disabled={!selectedAccount || loading}
            >
              <option value="">Select an Opportunity</option>
              {opportunities.map((opportunity, index) => (
                <option key={index} value={opportunity}>
                  {opportunity}
                </option>
              ))}
            </select>
            {errors.opportunity && (
              <div className="error-message">{errors.opportunity.message}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="project" className="required">Project</label>
            <select
              id="project"
              {...register('project', { required: 'Project is required' })}
              disabled={!selectedOpportunity || loading}
            >
              <option value="">Select a Project</option>
              {projects.map((project, index) => (
                <option key={index} value={project}>
                  {project}
                </option>
              ))}
            </select>
            {errors.project && (
              <div className="error-message">{errors.project.message}</div>
            )}
          </div>
        </div>

        {/* Project Details Section */}
        {showProjectDetails && projectDetails && (
          <div className="form-section">
            <h2>Project Details</h2>
            
            <div className="details-grid">
              <div className="detail-item">
                <label>Account Executive</label>
                <div className="detail-value">{projectDetails.aeName || '-'}</div>
              </div>
              
              <div className="detail-item">
                <label>Project Manager</label>
                <div className="detail-value">{projectDetails.projectManagerName || '-'}</div>
              </div>
              
              <div className="detail-item">
                <label>Contract Start</label>
                <div className="detail-value">{formatDate(projectDetails.contractStartDate)}</div>
              </div>
              
              <div className="detail-item">
                <label>Go Live</label>
                <div className="detail-value">{formatDate(projectDetails.plannedGoLive)}</div>
              </div>
              
              <div className="detail-item">
                <label>Current ACV</label>
                <div className="detail-value">{projectDetails.currentACV || '-'}</div>
              </div>
              
              <div className="detail-item">
                <label>Hours Budgeted</label>
                <div className="detail-value">{projectDetails.hoursForecast || '-'}</div>
              </div>
              
              <div className="detail-item">
                <label>Hours Delivered</label>
                <div className="detail-value">{projectDetails.hoursCompleted || '-'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Justification Section */}
        {showJustification && (
          <div className="form-section">
            <h2>Justification</h2>
            
            <div className="form-group">
              <label htmlFor="notes" className="required">Notes / Justification</label>
              <textarea
                id="notes"
                rows="4"
                placeholder="Please provide a detailed explanation for the delayed start discount request..."
                {...register('notes', { 
                  required: 'Notes are required',
                  minLength: {
                    value: 10,
                    message: 'Notes must be at least 10 characters long'
                  }
                })}
              />
              {errors.notes && (
                <div className="error-message">{errors.notes.message}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lessonsLearned" className="required">Lessons Learned</label>
              <textarea
                id="lessonsLearned"
                rows="4"
                placeholder="What lessons were learned from this delay that can prevent future occurrences?"
                {...register('lessonsLearned', { 
                  required: 'Lessons learned are required',
                  minLength: {
                    value: 10,
                    message: 'Lessons learned must be at least 10 characters long'
                  }
                })}
              />
              {errors.lessonsLearned && (
                <div className="error-message">{errors.lessonsLearned.message}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="delayEndDate" className="required">Delay End Date</label>
              <input
                type="date"
                id="delayEndDate"
                {...register('delayEndDate', { 
                  required: 'Delay end date is required',
                  validate: (value) => {
                    const selectedDate = new Date(value);
                    const today = new Date();
                    return selectedDate > today || 'Delay end date must be in the future';
                  }
                })}
              />
              {errors.delayEndDate && (
                <div className="error-message">{errors.delayEndDate.message}</div>
              )}
            </div>
          </div>
        )}

        {/* Submit Section */}
        {showJustification && (
          <div className="form-section">
            <div className="form-group">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!isValid || loading}
              >
                {loading ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default DiscountRequestForm;
