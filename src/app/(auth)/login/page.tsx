import React, { Suspense } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-md mx-auto p-1">
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              <Image
                src="/pharmadex.png"
                alt="Pharmadex Logo"
                fill
                sizes="56px"
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pharmadex</h1>
            <p className="text-xs text-slate-500 font-medium">Ethiopian Pharmacy Management System</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-lg">Staff Authentication</CardTitle>
            <CardDescription className="text-xs">
              Sign in with your individual pharmacist or owner account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-48 flex items-center justify-center text-xs text-slate-400">Loading form...</div>}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>Protected with RBAC & Individual Audit Trails</span>
        </div>
      </div>
    </div>
  );
}
