import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/common/LoadingScreen';
import Pagination from '../../components/common/Pagination';
import { format, formatDistanceToNow } from 'date-fns';

const StatusPill = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
    status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
    {status === 'active' ? 'Active' : 'Suspended'}
  </span>
);

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ page, limit: 10, search: debouncedSearch, status: statusFilter });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const handleStatusToggle = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    if (!confirm(`${newStatus === 'suspended' ? 'Suspend' : 'Activate'} ${user.name}?`)) return;
    setActionLoading(user._id + '_status');
    try {
      await adminAPI.updateStatus(user._id, newStatus);
      toast.success(`User ${newStatus}`);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Permanently delete ${user.name} and ALL their data? This cannot be undone.`)) return;
    setActionLoading(user._id + '_delete');
    try {
      await adminAPI.deleteUser(user._id);
      toast.success('User deleted');
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Users</h1>
        <p className="text-slate-400 text-sm mt-1">{pagination.total} registered users</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 h-9" placeholder="Search by name or email..." />
        </div>
        <div className="flex gap-1">
          {['All', 'active', 'suspended'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === s ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-white font-medium">No users found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['User', 'Email', 'Status', 'Applications', 'Joined', 'Last Login', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {users.map((user) => {
                    const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <tr key={user._id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{user.name}</p>
                              {user.role === 'admin' && <span className="text-xs text-brand-400">Admin</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                        </td>
                        <td className="px-5 py-4"><StatusPill status={user.status} /></td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-white">{user.jobCount}</span>
                          <span className="text-xs text-slate-600 ml-1">apps</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-slate-500">{format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-slate-500">
                            {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : 'Never'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* VIEW APPS button */}
                            <Link to={`/admin/users/${user._id}`}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors font-medium whitespace-nowrap">
                              👁 Manage Apps
                            </Link>
                            <button onClick={() => handleStatusToggle(user)} disabled={!!actionLoading}
                              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                                user.status === 'active'
                                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              }`}>
                              {actionLoading === user._id + '_status' ? <Spinner size="sm" /> : user.status === 'active' ? '🚫' : '✅'}
                            </button>
                            <button onClick={() => handleDelete(user)} disabled={!!actionLoading}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                              {actionLoading === user._id + '_delete' ? <Spinner size="sm" /> : '🗑️'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-800">
              {users.map((user) => {
                const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <div key={user._id} className="p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                        </div>
                      </div>
                      <StatusPill status={user.status} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/admin/users/${user._id}`}
                        className="text-xs px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 font-medium">
                        Manage Apps ({user.jobCount})
                      </Link>
                      <button onClick={() => handleStatusToggle(user)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium ${user.status === 'active' ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(user)} className="text-xs px-3 py-1.5 rounded-lg text-red-400 bg-red-500/10">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchUsers(p)} />
        </div>
      )}
    </div>
  );
}
