import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Check,
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, UserRole } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/errorHandling';
import { useAuth } from '../../context/AuthContext';
import { demoStore } from '../../services/demoStore';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'pending' | UserRole>('all');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.isDemo) {
      setUsers(demoStore.getUsers());
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: UserProfile[] = [];
        snapshot.forEach((d) => {
          fetched.push(d.data() as UserProfile);
        });
        setUsers(fetched.length > 0 ? fetched : demoStore.getUsers());
        setLoading(false);
      },
      (error) => {
        console.warn('Admin users fetch notice, falling back to local roster:', error);
        setUsers(demoStore.getUsers());
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const trainers = users.filter((u) => u.role === 'trainer' && u.isActive);
  const clients = users.filter((u) => u.role === 'user');
  const pendingRequests = users.filter(
    (u) => u.requestedRole && u.requestedRole !== u.role
  );

  // Toggle account active / disabled state
  const handleToggleActiveState = async (user: UserProfile) => {
    setUpdatingUid(user.uid);
    try {
      const newState = !user.isActive;
      if (currentUser?.isDemo) {
        const updated = { ...user, isActive: newState, updatedAt: new Date().toISOString() };
        demoStore.saveUser(updated);
        setUsers(demoStore.getUsers());
      } else {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          isActive: newState,
          updatedAt: new Date().toISOString(),
        });
      }
      setNotification(`User ${user.email} status set to ${newState ? 'ACTIVE' : 'DISABLED'}`);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setUpdatingUid(null);
    }
  };

  // Change or assign role
  const handleChangeRole = async (user: UserProfile, newRole: UserRole) => {
    setUpdatingUid(user.uid);
    try {
      if (currentUser?.isDemo) {
        const updated = {
          ...user,
          role: newRole,
          requestedRole: newRole,
          updatedAt: new Date().toISOString(),
        };
        demoStore.saveUser(updated);
        setUsers(demoStore.getUsers());
      } else {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          role: newRole,
          requestedRole: newRole,
          updatedAt: new Date().toISOString(),
        });
      }
      setNotification(
        `Assigned ${newRole === 'user' ? 'CLIENT' : newRole.toUpperCase()} access to ${user.displayName || user.email}`
      );
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setUpdatingUid(null);
    }
  };

  // Assign or reassign trainer to a user
  const handleAssignTrainer = async (userId: string, trainerId: string) => {
    setUpdatingUid(userId);
    try {
      if (currentUser?.isDemo) {
        const target = users.find((u) => u.uid === userId);
        if (target) {
          const updated = {
            ...target,
            trainerId: trainerId || undefined,
            updatedAt: new Date().toISOString(),
          };
          demoStore.saveUser(updated);
          setUsers(demoStore.getUsers());
        }
      } else {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          trainerId: trainerId || null,
          updatedAt: new Date().toISOString(),
        });
      }
      setNotification('Trainer assignment updated successfully');
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setUpdatingUid(null);
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (roleFilter === 'pending') {
      return Boolean(u.requestedRole && u.requestedRole !== u.role);
    }
    return roleFilter === 'all' || u.role === roleFilter;
  });

  const roleDisplayName = (r?: UserRole) => {
    if (r === 'admin') return 'Super Admin';
    if (r === 'trainer') return 'Trainer';
    return 'Client';
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-28 md:pb-12 transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-400">
              <Shield className="w-3.5 h-3.5" /> Super Admin Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            User & RBAC Access Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Review registration access requests, assign or change member roles, assign trainers, and manage account states.
          </p>
        </div>
      </div>

      {notification && (
        <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {notification}
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
            {users.length}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Access Requests</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {pendingRequests.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Trainers
            </span>
            <UserCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums">
            {trainers.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Clients
            </span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {clients.length}
          </p>
        </div>

        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Disabled
            </span>
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
            {users.filter((u) => !u.isActive).length}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 mb-6 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              roleFilter === 'all'
                ? 'bg-purple-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              roleFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            Requests ({pendingRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('user')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              roleFilter === 'user'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Clients
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('trainer')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              roleFilter === 'trainer'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Trainers
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              roleFilter === 'admin'
                ? 'bg-purple-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Admins
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-purple-500 dark:text-purple-400" />
            Loading system directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No users match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">User / Member</th>
                  <th className="px-5 py-3.5">Requested Access</th>
                  <th className="px-5 py-3.5">Assigned Role</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5">Assigned Trainer</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
                {filteredUsers.map((user) => {
                  const isBusy = updatingUid === user.uid;
                  const hasPendingRequest =
                    user.requestedRole && user.requestedRole !== user.role;

                  return (
                    <tr
                      key={user.uid}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        !user.isActive
                          ? 'bg-rose-50/50 dark:bg-rose-950/10'
                          : hasPendingRequest
                          ? 'bg-amber-50/40 dark:bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 shrink-0">
                            {user.displayName?.[0] || user.email?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {user.displayName || 'Unnamed User'}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {user.email}
                            </p>
                            {(user.specialty || user.fitnessGoal) && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {user.specialty || user.fitnessGoal}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Requested Access */}
                      <td className="px-5 py-4">
                        {hasPendingRequest ? (
                          <div className="flex flex-col items-start gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold">
                              <Clock className="w-3 h-3" />
                              Requests {roleDisplayName(user.requestedRole)}
                            </span>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleChangeRole(user, user.requestedRole!)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black shadow-sm transition-all"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              Approve {roleDisplayName(user.requestedRole)}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {roleDisplayName(user.requestedRole || user.role)} (Matched)
                          </span>
                        )}
                      </td>

                      {/* Role Selector */}
                      <td className="px-5 py-4">
                        <select
                          value={user.role}
                          disabled={isBusy}
                          onChange={(e) => handleChangeRole(user, e.target.value as UserRole)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all focus:outline-none ${
                            user.role === 'admin'
                              ? 'border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                              : user.role === 'trainer'
                              ? 'border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                              : 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          <option value="user" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                            Client (User)
                          </option>
                          <option value="trainer" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                            Trainer
                          </option>
                          <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                            Super Admin
                          </option>
                        </select>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleActiveState(user)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                            user.isActive
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                          title="Click to toggle Active / Disabled state"
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Disabled
                            </>
                          )}
                        </button>
                      </td>

                      {/* Assigned Trainer */}
                      <td className="px-5 py-4">
                        {user.role === 'user' ? (
                          <select
                            value={user.trainerId || ''}
                            disabled={isBusy}
                            onChange={(e) => handleAssignTrainer(user.uid, e.target.value)}
                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-300 focus:border-purple-500 focus:outline-none"
                          >
                            <option value="">No Trainer Assigned</option>
                            {trainers.map((t) => (
                              <option key={t.uid} value={t.uid}>
                                {t.displayName || t.email}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            N/A ({user.role})
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleActiveState(user)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                        >
                          {user.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
