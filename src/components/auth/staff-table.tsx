'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateStaffModal } from './create-staff-modal';
import { ResetPasswordModal } from './reset-password-modal';
import { EditPermissionsModal } from './edit-permissions-modal';
import { toggleStaffStatusAction } from '@/app/actions/staff';
import { formatDate } from '@/lib/utils';
import { UserPlus, UserCheck, UserX, KeyRound, Shield, AlertCircle, Phone, Calendar, ShieldCheck } from 'lucide-react';
import type { Profile } from '@/types';

interface StaffTableProps {
  currentUserId: string;
  staffList: Profile[];
}

export function StaffTable({ currentUserId, staffList }: StaffTableProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStaffForReset, setSelectedStaffForReset] = useState<Profile | null>(null);
  const [selectedStaffForPermissions, setSelectedStaffForPermissions] = useState<Profile | null>(null);
  const [loadingStaffId, setLoadingStaffId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleToggleStatus(staff: Profile) {
    if (staff.id === currentUserId) return;

    setLoadingStaffId(staff.id);
    setActionError(null);

    const res = await toggleStaffStatusAction(staff.id, !staff.is_active);
    setLoadingStaffId(null);

    if (res.error) {
      setActionError(res.error);
    }
  }

  const pharmacists = staffList.filter((s) => s.role === 'PHARMACIST');
  const admins = staffList.filter((s) => s.role === 'ADMIN');

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <p>{actionError}</p>
        </div>
      )}

      {/* Header with Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Pharmacy Staff & Access</h2>
          <p className="text-xs text-slate-500">
            Manage individual accounts for the pharmacy owner and dispensing pharmacists.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          variant="primary"
          size="md"
          className="shadow-sm font-semibold gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Pharmacist
        </Button>
      </div>

      {/* Owner Section */}
      <Card className="border-teal-100 bg-teal-50/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-700" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-teal-900">
              Pharmacy Owner / Administrator
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-teal-100/60">
            {admins.map((admin) => (
              <div key={admin.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{admin.full_name}</span>
                    <Badge variant="default">Owner</Badge>
                    <Badge variant="success">Active</Badge>
                  </div>
                  {admin.phone_number && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {admin.phone_number}
                    </p>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Registered {formatDate(admin.created_at)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pharmacists List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">Dispensing Pharmacists</CardTitle>
            <CardDescription className="text-xs">
              Pharmacists can record sales and manage their assigned shifts.
            </CardDescription>
          </div>
          <Badge variant="neutral">{pharmacists.length} Registered</Badge>
        </CardHeader>

        <CardContent className="p-0">
          {pharmacists.length === 0 ? (
            /* Empty State */
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <UserX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">No Pharmacists Registered Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add 2–3 pharmacist accounts so each team member can sign in individually to operate their shift and record sales.
                </p>
              </div>
              <Button onClick={() => setIsAddOpen(true)} variant="outline" size="sm" className="mt-2">
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Add First Pharmacist
              </Button>
            </div>
          ) : (
            /* Staff List */
            <div className="divide-y divide-slate-100">
              {pharmacists.map((pharmacist) => {
                const isItemLoading = loadingStaffId === pharmacist.id;
                return (
                  <div
                    key={pharmacist.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{pharmacist.full_name}</span>
                        <Badge variant="neutral">Pharmacist</Badge>
                        {pharmacist.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="danger">Disabled</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {pharmacist.phone_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {pharmacist.phone_number}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined {formatDate(pharmacist.created_at)}
                        </span>
                      </div>

                      {/* Privileged Permissions Badges */}
                      {pharmacist.permissions && pharmacist.permissions.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-400 font-medium mr-1">Privileges:</span>
                          {pharmacist.permissions.map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 capitalize"
                            >
                              <ShieldCheck className="w-2.5 h-2.5 text-teal-700" />
                              {p.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 pt-0.5">
                          Standard access (POS sales & personal shifts)
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStaffForPermissions(pharmacist)}
                        disabled={isItemLoading}
                        className="text-xs h-9 px-2.5 text-teal-800 border-teal-200 hover:bg-teal-50"
                        title="Manage Privileged Access Rights"
                      >
                        <Shield className="w-3.5 h-3.5 mr-1 text-teal-700" />
                        Permissions
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStaffForReset(pharmacist)}
                        disabled={isItemLoading}
                        className="text-xs h-9 px-2.5"
                      >
                        <KeyRound className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        Reset Password
                      </Button>

                      {pharmacist.is_active ? (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleToggleStatus(pharmacist)}
                          isLoading={isItemLoading}
                          disabled={isItemLoading}
                          className="text-xs h-9 px-2.5"
                        >
                          <UserX className="w-3.5 h-3.5 mr-1" />
                          Disable
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleToggleStatus(pharmacist)}
                          isLoading={isItemLoading}
                          disabled={isItemLoading}
                          className="text-xs h-9 px-2.5 bg-emerald-700 hover:bg-emerald-800"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateStaffModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <ResetPasswordModal
        staff={selectedStaffForReset}
        isOpen={Boolean(selectedStaffForReset)}
        onClose={() => setSelectedStaffForReset(null)}
      />
      <EditPermissionsModal
        pharmacist={selectedStaffForPermissions}
        isOpen={Boolean(selectedStaffForPermissions)}
        onClose={() => setSelectedStaffForPermissions(null)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
