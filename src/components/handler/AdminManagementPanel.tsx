import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Building,
  Lock,
} from 'lucide-react';
import type { AdminAccessAudit, UserAccount } from '../../types';
import {
  approveHandler,
  getAccessAudits,
  getRegisteredUsers,
  reassignHandlerDepartment,
  updateHandlerStatus,
} from '../../services/authService';
import { MUNICIPAL_AUTHORITIES } from '../../services/triageEngine';

interface AdminManagementPanelProps {
  currentAdmin: UserAccount;
}

export const AdminManagementPanel: React.FC<AdminManagementPanelProps> = ({
  currentAdmin,
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [audits, setAudits] = useState<AdminAccessAudit[]>([]);
  const [filterRole, setFilterRole] = useState<'all' | 'pending' | 'approved' | 'suspended'>('all');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [newDepartmentId, setNewDepartmentId] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'suspend' | 'reassign' | null>(null);

  const loadData = () => {
    try {
      setUsers(getRegisteredUsers(currentAdmin));
      setAudits(getAccessAudits(currentAdmin));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentAdmin]);

  const handleApprove = (u: UserAccount) => {
    const dept = MUNICIPAL_AUTHORITIES.find((d) => d.id === u.departmentId) || MUNICIPAL_AUTHORITIES[0];
    approveHandler(currentAdmin, u.id, dept.id, dept.name);
    loadData();
  };

  const handleSuspend = (u: UserAccount) => {
    const reason = window.prompt(`Provide reason for suspending ${u.name}'s access:`, 'Standard periodic security review');
    if (reason) {
      updateHandlerStatus(currentAdmin, u.id, 'suspended', reason);
      loadData();
    }
  };

  const handleReinstate = (u: UserAccount) => {
    updateHandlerStatus(currentAdmin, u.id, 'approved', 'Reinstated by Administrator');
    loadData();
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newDepartmentId) return;
    const dept = MUNICIPAL_AUTHORITIES.find((d) => d.id === newDepartmentId);
    if (dept) {
      reassignHandlerDepartment(currentAdmin, selectedUser.id, dept.id, dept.name);
      setActionType(null);
      setSelectedUser(null);
      loadData();
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole === 'all') return true;
    return u.status === filterRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Administrator Status Overview Banner */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid var(--brand-primary)',
          backgroundColor: 'var(--brand-light)',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={22} />
              <span>Civic Voice Administrator Access & Staff Governance</span>
            </h3>
            <p style={{ fontSize: '0.925rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
              Logged in as <strong>{currentAdmin.name}</strong> ({currentAdmin.email}). Only your administrator account can approve or revoke handler access.
            </p>
          </div>

          <div
            style={{
              padding: '0.45rem 0.85rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--brand-accent)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Lock size={13} />
            <span>First-Admin Bootstrap: Permanently Locked</span>
          </div>
        </div>
      </div>

      {/* Staff Accounts Management Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3>Municipal Handler Staff Directory ({users.length})</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Review registration requests, approve new field officers, and configure department teams.
            </p>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(['all', 'pending', 'approved', 'suspended'] as const).map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${filterRole === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterRole(st)}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* User Table */}
        <div className="responsive-table-container">
          <table className="civic-table">
            <thead>
              <tr>
                <th>Officer / Staff</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Registration Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-low" style={{ fontSize: '0.75rem' }}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {user.departmentName || 'General Triage'}
                    </span>
                  </td>
                  <td>
                    {user.status === 'approved' && (
                      <span className="badge badge-status-resolved">Approved</span>
                    )}
                    {user.status === 'pending' && (
                      <span className="badge badge-high">Pending Approval</span>
                    )}
                    {user.status === 'suspended' && (
                      <span className="badge badge-critical">Suspended</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.825rem' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {user.status === 'pending' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApprove(user)}
                          id={`btn-approve-${user.id}`}
                        >
                          <UserCheck size={14} />
                          <span>Approve</span>
                        </button>
                      )}

                      {user.status === 'approved' && user.role !== 'admin' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewDepartmentId(user.departmentId || MUNICIPAL_AUTHORITIES[0].id);
                              setActionType('reassign');
                            }}
                          >
                            <Building size={13} />
                            <span>Reassign</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#ef4444' }}
                            onClick={() => handleSuspend(user)}
                          >
                            <UserX size={13} />
                            <span>Suspend</span>
                          </button>
                        </>
                      )}

                      {user.status === 'suspended' && (
                        <button
                          type="button"
                          className="btn btn-accent btn-sm"
                          onClick={() => handleReinstate(user)}
                        >
                          Reinstate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Access Decision Audit Trail Log */}
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Clock size={18} color="var(--brand-primary)" />
          <span>Administrator Access Control Audit Trail</span>
        </h3>
        <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
          Permanent, timestamped record of handler approvals, department assignments, and security actions.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {audits.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--brand-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {item.action.replace('_', ' ').toUpperCase()}
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>
                  Target: <strong>{item.targetUserName}</strong> • {item.details}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Authorized by: {item.actorName}
                </span>
              </div>
              <span className="mono" style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                {new Date(item.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Department Reassign Modal */}
      {actionType === 'reassign' && selectedUser && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ marginBottom: '0.5rem' }}>Reassign Department Team</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Reassign <strong>{selectedUser.name}</strong> to a different municipal authority.
            </p>

            <form onSubmit={handleReassignSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="select-reassign-authority">
                  Select Authority Department:
                </label>
                <select
                  id="select-reassign-authority"
                  className="form-select"
                  value={newDepartmentId}
                  onChange={(e) => setNewDepartmentId(e.target.value)}
                >
                  {MUNICIPAL_AUTHORITIES.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setActionType(null);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
