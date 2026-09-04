import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI, lifecycleAPI, partsAPI, assignmentsAPI, authAPI } from '../services/api';

function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [newPart, setNewPart] = useState({ partName: '', quantity: 1 });
  const [showAddPart, setShowAddPart] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [showAssignControls, setShowAssignControls] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchJobDetails();
    
    // Fetch technicians if user is dispatcher
    if (userData.role === 'dispatcher') {
      fetchTechnicians();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const response = await jobsAPI.getJob(id);
      setJob(response.data.job);
      setTimeline(response.data.timeline);
      setParts(response.data.parts);
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching job details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await authAPI.getUsers();
      const techUsers = response.data.users.filter(u => u.role === 'technician');
      setTechnicians(techUsers);
    } catch (err) {
      console.error('Error fetching technicians:', err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const completionNote = newStatus === 'completed' 
        ? prompt('Please enter a completion note:') 
        : '';
      
      if (newStatus === 'completed' && !completionNote) {
        return;
      }

      await lifecycleAPI.updateStatus(id, newStatus, completionNote);
      fetchJobDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating status');
    }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    try {
      await partsAPI.addPart({
        jobId: id,
        ...newPart,
      });
      setNewPart({ partName: '', quantity: 1 });
      setShowAddPart(false);
      fetchJobDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding part');
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) {
      alert('Please select a technician');
      return;
    }

    try {
      await assignmentsAPI.assignTechnician(id, selectedTechnician);
      setSelectedTechnician('');
      setShowAssignControls(false);
      fetchJobDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Error assigning technician');
    }
  };

  const handleRemoveTechnician = async (technicianId) => {
    if (!confirm('Are you sure you want to remove this technician from the job?')) {
      return;
    }

    try {
      await assignmentsAPI.removeTechnician(id, technicianId);
      fetchJobDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Error removing technician');
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      unassigned: '👤',
      assigned: '👥',
      en_route: '🚚',
      on_site: '📍',
      completed: '✅'
    };
    return icons[status] || '📋';
  };

  const getStatusColor = (status) => {
    const colors = {
      unassigned: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      en_route: 'bg-yellow-100 text-yellow-800',
      on_site: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      emergency: 'bg-pink-100 text-pink-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const isDispatcher = user?.role === 'dispatcher';
  const isAssignedTechnician = job?.assignedTechnicians?.some(
    (tech) => tech._id === user?._id
  );

  return (
    <div className="min-h-screen bg-gray-50" style={{backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-800">FieldPulse</h1>
            <nav className="flex gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/jobs')}
                className="text-orange-500 font-medium border-b-2 border-orange-500"
              >
                Jobs
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">{user?.name}</p>
              <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {job && (
          <div className="space-y-6">
            {/* Job Information */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{job.customerName}</h2>
                  <p className="text-gray-600">{job.siteAddress}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(job.priority)}`}>
                    {job.priority}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                    <span>{getStatusIcon(job.status)}</span>
                    <span>{job.status.replace('_', ' ')}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-gray-700">{job.description}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Scheduled</h4>
                  <p className="text-gray-700">
                    {new Date(job.scheduledDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} at {job.startTime}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Duration</h4>
                  <p className="text-gray-700">{job.estimatedDuration} hours</p>
                </div>
              </div>

              {job.assignedTechnicians && job.assignedTechnicians.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Technicians</h4>
                    {isDispatcher && (
                      <button
                        onClick={() => setShowAssignControls(!showAssignControls)}
                        className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                      >
                        {showAssignControls ? 'Cancel' : '+ Assign Technician'}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.assignedTechnicians.map((tech) => (
                      <div key={tech._id} className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {tech.name}
                        </span>
                        {isDispatcher && (
                          <button
                            onClick={() => handleRemoveTechnician(tech._id)}
                            className="text-red-500 hover:text-red-600 text-sm"
                            title="Remove technician"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isDispatcher && showAssignControls && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Assign Technician</h4>
                  <div className="flex gap-2">
                    <select
                      value={selectedTechnician}
                      onChange={(e) => setSelectedTechnician(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select a technician</option>
                      {technicians
                        .filter(tech => !job.assignedTechnicians?.some(jt => jt._id === tech._id))
                        .map((tech) => (
                          <option key={tech._id} value={tech._id}>
                            {tech.name} ({tech.email})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={handleAssignTechnician}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              )}

              {isDispatcher && !job.assignedTechnicians?.length && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowAssignControls(!showAssignControls)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium transition-colors"
                  >
                    + Assign First Technician
                  </button>
                </div>
              )}

              {job.completionNote && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-2">Completion Note</h4>
                  <p className="text-green-700">{job.completionNote}</p>
                </div>
              )}

              {/* Status Actions */}
              {isAssignedTechnician && job.status !== 'completed' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Update Status</h4>
                  <div className="flex gap-2">
                    {job.status === 'unassigned' && (
                      <button
                        onClick={() => handleStatusChange('assigned')}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium transition-colors"
                      >
                        Mark as Assigned
                      </button>
                    )}
                    {job.status === 'assigned' && (
                      <button
                        onClick={() => handleStatusChange('en_route')}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 font-medium transition-colors"
                      >
                        Mark as En Route
                      </button>
                    )}
                    {job.status === 'en_route' && (
                      <button
                        onClick={() => handleStatusChange('on_site')}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium transition-colors"
                      >
                        Mark as On Site
                      </button>
                    )}
                    {job.status === 'on_site' && (
                      <button
                        onClick={() => handleStatusChange('completed')}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Parts Used */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Parts Used</h3>
                {isAssignedTechnician && job.status !== 'completed' && (
                  <button
                    onClick={() => setShowAddPart(!showAddPart)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium transition-colors"
                  >
                    {showAddPart ? 'Cancel' : 'Add Part'}
                  </button>
                )}
              </div>

              {showAddPart && (
                <form onSubmit={handleAddPart} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Part name"
                      value={newPart.partName}
                      onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={newPart.quantity}
                      onChange={(e) => setNewPart({ ...newPart, quantity: parseInt(e.target.value) })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium transition-colors"
                  >
                    Add Part
                  </button>
                </form>
              )}

              {parts.length === 0 ? (
                <p className="text-gray-500">No parts recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {parts.map((part) => (
                    <div key={part._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-800">{part.partName}</span>
                        <span className="text-gray-600 ml-2">x{part.quantity}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        Added by {part.recordedBy?.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Timeline</h3>
              {timeline.length === 0 ? (
                <p className="text-gray-500">No timeline events yet</p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event) => (
                    <div key={event._id} className="border-l-4 border-orange-500 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800 capitalize">
                            {event.eventType.replace('_', ' ')}
                          </h4>
                          <p className="text-gray-600">{event.description}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        By {event.performedBy?.name} ({event.performedBy?.role})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default JobDetail;