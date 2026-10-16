'use client';

import React, { useState } from 'react';
import { resetStaffPasswordAction } from '@/app/actions/staff';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, X, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import type { Profile } from '@/types';

interface ResetPasswordModalProps {
  staff: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ResetPasswordModal({ staff, isOpen, onClose }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen || !staff) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const res = await resetStaffPasswordAction(staff!.id, password);
    setIsLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(res.message || 'Password updated successfully.');
      setTimeout(() => {
        setPassword('');
        setSuccess(null);
        onClose();
      }, 1500);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="flex min-h-full items-start sm:items-center justify-center pt-4 pb-12 sm:py-8">
        <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-teal-800">
            <KeyRound className="w-5 h-5" />
            <h3 className="font-semibold text-slate-900 text-base">Reset Password</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600">
            Resetting password for: <strong className="text-slate-900">{staff.full_name}</strong>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p>{success}</p>
            </div>
          )}

          <div className="relative">
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isLoading} disabled={isLoading}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
