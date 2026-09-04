import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, lifecycleAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [runningLate, setRunningLate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchDashboardData();
    fetchRunningLate();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRunningLate = async () => {
    try {
      const response = await lifecycleAPI.getRunningLate();
      setRunningLate(response.data.runningLateJobs);
    } catch (error) {
      console.error('Error fetching running late jobs:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Prepare chart data
  const statusColors = {
    unassigned: '#9ca3af',
    assigned: '#3b82f6',
    en_route: '#f59e0b',
    on_site: '#f97316',
    completed: '#10b981'
  };

  const statusData = stats?.jobsByStatus?.map(item => ({
    name: item._id.replace('_', ' '),
    value: item.count,
    color: statusColors[item._id] || '#9ca3af'
  })) || [];

  const completionsData = stats?.completedPerDay?.map(item => ({
    date: new Date(item._id.year, item._id.month - 1, item._id.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: item.count
  })) || [];

  const technicianData = stats?.jobsByTechnician?.map(item => ({
    name: item.technicianName || 'Unknown',
    jobs: item.count
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50" style={{backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">FieldPulse</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Hello, {user?.name}</p>
              <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Hello, {user?.name}</h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">SCHEDULED TODAY</h3>
            <p className="text-4xl font-bold text-gray-800 mt-2">{stats?.scheduledToday || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">COMPLETED TODAY</h3>
            <p className="text-4xl font-bold text-gray-800 mt-2">{stats?.completedToday || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">RUNNING LATE</h3>
            <p className="text-4xl font-bold text-red-600 mt-2">{stats?.runningLate || 0}</p>
          </div>
          {user?.role === 'dispatcher' && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">UNASSIGNED</h3>
              <p className="text-4xl font-bold text-gray-800 mt-2">{stats?.unassigned || 0}</p>
            </div>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Completions Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Completions - last 14 days</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status breakdown</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600 capitalize">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technician Workload */}
        {user?.role === 'dispatcher' && technicianData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Active workload per technician</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={technicianData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12}} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="jobs" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Running Late Alert */}
        {runningLate.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-red-800 mb-4">
              ⚠️ Running Late Jobs ({runningLate.length})
            </h2>
            <div className="space-y-3">
              {runningLate.map((job) => (
                <div key={job._id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-800">{job.customerName}</h4>
                    <p className="text-sm text-gray-600">{job.siteAddress}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Status: <span className="font-medium">{job.status.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/jobs')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 font-medium transition-colors"
          >
            View All Jobs
          </button>
          {user?.role === 'dispatcher' && (
            <button
              onClick={() => navigate('/jobs?status=unassigned')}
              className="bg-white text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium border border-gray-300 transition-colors"
            >
              View Unassigned Jobs
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;