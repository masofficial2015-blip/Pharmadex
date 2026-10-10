'use client';

import React, { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction, type ActionResponse } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ShieldAlert } from 'lucide-react';

const initialState: ActionResponse = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {/* Account Deactivated or URL Alert */}
      {urlError === 'account_disabled' && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
          <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Account Deactivated:</strong> Your account has been disabled by the pharmacy owner. Please contact management for assistance.
          </p>
        </div>
      )}

      {/* Action Error Alert */}
      {state.error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <p>{state.error}</p>
        </div>
      )}

      {/* Email Input */}
      <div className="relative">
        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="pharmacist@pharmadex.et"
          error={state.fieldErrors?.email}
          disabled={isPending}
        />
        <div className="absolute right-3.5 top-8 text-slate-400 pointer-events-none">
          <Mail className="w-4 h-4" />
        </div>
      </div>

      {/* Password Input */}
      <div className="relative">
        <Input
          label="Password"
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          placeholder="••••••••"
          error={state.fieldErrors?.password}
          disabled={isPending}
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

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isPending}
        disabled={isPending}
        className="w-full text-base font-semibold shadow-md mt-2"
      >
        <Lock className="w-4 h-4 mr-2" />
        Sign In to Pharmadex
      </Button>

      <p className="text-center text-xs text-slate-400 pt-2">
        Restricted to registered staff only. Public registration is disabled.
      </p>
    </form>
  );
}
