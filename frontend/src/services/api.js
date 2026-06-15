const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || response.statusText);
  }

  return response.json();
}

export const api = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  getUsers: () => request('/users'),
  getFreelancers: () => request('/freelancers'),
  getClients: () => request('/clients'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  getUser: (id) => request(`/users/${id}`),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getUserExperiences: (userId) => request(`/users/${userId}/experiences`),
  createExperience: (userId, data) => request(`/users/${userId}/experiences`, { method: 'POST', body: JSON.stringify(data) }),
  updateExperience: (id, data) => request(`/experiences/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteExperience: (id) => request(`/experiences/${id}`, { method: 'DELETE' }),
  updateProjectStatus: (id, status) => request(`/projects/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getProposals: (projectId) => request(`/projects/${projectId}/proposals`),
  createProposal: (projectId, data) => request(`/projects/${projectId}/proposals`, { method: 'POST', body: JSON.stringify(data) }),
  updateProposal: (proposalId, status) => request(`/proposals/${proposalId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getMilestones: (projectId) => request(`/projects/${projectId}/milestones`),
  createMilestone: (projectId, data) => request(`/projects/${projectId}/milestones`, { method: 'POST', body: JSON.stringify(data) }),
  updateMilestone: (milestoneId, status) => request(`/milestones/${milestoneId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getPayments: (projectId) => request(`/projects/${projectId}/payments`),
  createPayment: (projectId, data) => request(`/projects/${projectId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  getReviews: (projectId) => request(`/projects/${projectId}/reviews`),
  createReview: (projectId, data) => request(`/projects/${projectId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
  getChatMessages: (myId, partnerId) => request(`/chat/messages/${myId}/${partnerId}`),
  // Freelancer GitHub projects
  getFreelancerGithubProjects: (freelancerId) => request(`/freelancers/${freelancerId}/github-projects`),
  createFreelancerGithubProject: (freelancerId, data) => request(`/freelancers/${freelancerId}/github-projects`, { method: 'POST', body: JSON.stringify(data) }),
};
