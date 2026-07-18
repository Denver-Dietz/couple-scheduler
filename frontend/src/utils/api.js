/**
 * Frontend API client.
 * Provides a unified interface to the FastAPI backend.
 */
const getBackendUrl = () => {
  // If running via Vite dev server (usually port 5173), default to port 8080.
  if (window.location.port === '5173') {
    return 'http://localhost:8080';
  }
  return window.location.origin;
};

export const BACKEND_URL = getBackendUrl();
export const BASE_URL = `${BACKEND_URL}/api`;

/**
 * Universal fetch wrapper for API requests.
 * 
 * Why:
 * - Implements a strict 10-second timeout using AbortController to prevent the UI from hanging
 *   indefinitely if the Python backend crashes or gets stuck on an LLM call.
 * - Standardizes error handling and JSON parsing across all feature components.
 */
async function request(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'Request failed');
    }
    return res.json();
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('Request timed out — is the backend running?');
    throw e;
  }
}

export const api = {
  // Generic helper methods used by various sub-components
  post: (path, data = {}, options = {}) => request(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: data instanceof FormData ? data : JSON.stringify(data),
    ...options
  }),
  get: (path, options = {}) => request(`${BASE_URL}${path}`, options),
  put: (path, data = {}, options = {}) => request(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(data),
    ...options
  }),
  delete: (path, options = {}) => request(`${BASE_URL}${path}`, {
    method: 'DELETE',
    ...options
  }),

  getQotd: () => request(`${BASE_URL}/qotd`),
  getSettings: () => request(`${BASE_URL}/settings`),
  setSetting: (key, value) => request(`${BASE_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value })
  }),
  setSettingsBulk: (settingsArray) => request(`${BASE_URL}/settings/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settingsArray)
  }),

  getRecentActivity: () => request(`${BASE_URL}/recent_activity`),
  getFutureCalendar: () => request(`${BASE_URL}/calendar/future`),
  
  getCurrentCheckIn: (userId) => request(`${BASE_URL}/checkins/current?user_id=${userId}`),
  submitCheckIn: (userId, data) => request(`${BASE_URL}/checkins/submit?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  getCheckInResults: (monthYear, userId) => request(`${BASE_URL}/checkins/results?month_year=${monthYear}&user_id=${userId}`),
  createCommitment: (data) => request(`${BASE_URL}/commitments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteCommitment: (id) => request(`${BASE_URL}/commitments/${id}`, { method: 'DELETE' }),
  deleteBucketListItem: (id) => request(`${BASE_URL}/bucket-list/${id}`, { method: 'DELETE' }),

  getGoals: () => request(`${BASE_URL}/goals`),
  createGoal: (data) => request(`${BASE_URL}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteGoal: (id) => request(`${BASE_URL}/goals/${id}`, { method: 'DELETE' }),

  getProjects: () => request(`${BASE_URL}/projects`),
  createProject: (data) => request(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteProject: (id) => request(`${BASE_URL}/projects/${id}`, { method: 'DELETE' }),

  getWorkShifts: () => request(`${BASE_URL}/workshifts`),
  createWorkShift: (data) => request(`${BASE_URL}/workshifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteWorkShift: (id) => request(`${BASE_URL}/workshifts/${id}`, { method: 'DELETE' }),

  getSleepSchedules: () => request(`${BASE_URL}/sleep`),
  createSleepSchedule: (data) => request(`${BASE_URL}/sleep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteSleepSchedule: (id) => request(`${BASE_URL}/sleep/${id}`, { method: 'DELETE' }),

  generateSchedule: (startDate, endDate) => request(`${BASE_URL}/schedule/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start_date: startDate, end_date: endDate })
  }),
  getLatestSchedule: () => request(`${BASE_URL}/schedule/latest`),
  
  skipItem: (data) => request(`${BASE_URL}/schedule/item/skip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  rescheduleCommitment: (id, data) => request(`${BASE_URL}/commitments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  getRampingGoals: () => request(`${BASE_URL}/goals/ramping`),
  pauseGoalRamp: (id) => request(`${BASE_URL}/goals/${id}/pause_ramp`, { method: 'POST' }),
  
  getJournalEntries: () => request(`${BASE_URL}/journal`),
  createJournalEntry: (data) => request(`${BASE_URL}/journal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  editJournalEntry: (entryId, data) => request(`${BASE_URL}/journal/${entryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteJournalEntry: (entryId) => request(`${BASE_URL}/journal/${entryId}`, {
    method: 'DELETE'
  }),
  addJournalComment: (entryId, data) => request(`${BASE_URL}/journal/${entryId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  toggleJournalReaction: (entryId, data) => request(`${BASE_URL}/journal/${entryId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  enhanceJournalText: (data) => request(`${BASE_URL}/journal/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  restartBot: () => request(`${BASE_URL}/bot/restart`, { method: 'POST' }),
  getBotStatus: () => request(`${BASE_URL}/bot/status`),
  
  getWizardData: (user_id, start_date, end_date) => request(`${BASE_URL}/schedule/wizard-data?user_id=${user_id}&start_date=${start_date}&end_date=${end_date}`),
  suggestGoal: (data) => request(`${BASE_URL}/schedule/suggest/goal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  suggestProject: (data) => request(`${BASE_URL}/schedule/suggest/project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  submitSchedule: (data) => request(`${BASE_URL}/schedule/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  
  updateDatePlan: (cid, data) => request(`${BASE_URL}/commitments/${cid}/plan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  
  getSwipes: () => request(`${BASE_URL}/dates/swipes`),
  swipe: (data) => request(`${BASE_URL}/dates/swipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  resetSwipes: () => request(`${BASE_URL}/dates/reset_swipes`, { method: 'POST' }),
  
  uploadMemory: (formData) => request(`${BASE_URL}/memories/upload`, {
    method: 'POST',
    body: formData
  }),
};
