import React, { useState, useEffect } from 'react';
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

  // Watch form values for conditional rendering
  const watchedAccount = watch('account');
  const watchedOpportunity = watch('opportunity');
  const watchedProject = watch('project');

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

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
  }, [watchedAccount, setValue]);

  // Load projects when opportunity changes
  useEffect(() => {
    if (watchedOpportunity) {
      loadProjects(watchedAccount, watchedOpportunity);
      setSelectedOpportunity(watchedOpportunity);
      setValue('project', '');
      setShowProjectDetails(false);
      setShowJustification(false);
    }
  }, [watchedOpportunity, watchedAccount, setValue]);

  // Load project details when project changes
  useEffect(() => {
    if (watchedProject) {
      loadProjectDetails(watchedProject);
      setShowProjectDetails(true);
      setShowJustification(true);
    }
  }, [watchedProject]);

  // Load accounts from API
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/accounts');
      setAccounts(response.data.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load opportunities for selected account
  const loadOpportunities = async (accountName) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/opportunities', {
        data: { accountName }
      });
      setOpportunities(response.data.data);
    } catch (error) {
      console.error('Error loading opportunities:', error);
      toast.error('Failed to load opportunities. Please try again.');
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  // Load projects for selected account and opportunity
  const loadProjects = async (accountName, opportunityName) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/projects', {
        data: { accountName, opportunityName }
      });
      setProjects(response.data.data);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects. Please try again.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Load project details
  const loadProjectDetails = async (projectName) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/project/${encodeURIComponent(projectName)}`);
      setProjectDetails(response.data.data);
    } catch (error) {
      console.error('Error loading project details:', error);
      toast.error('Failed to load project details. Please try again.');
      setProjectDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Add user email (in a real app, this would come from authentication)
      const formData = {
        ...data,
        requestedByEmail: 'user@example.com' // Placeholder
      };

      const response = await axios.post('/api/submit-request', formData);
      
      if (response.data.success) {
        toast.success('Request submitted successfully!');
        navigate('/thank-you');
      } else {
        toast.error(response.data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit request. Please try again.');
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
