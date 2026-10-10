import React from 'react';
import Link from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="max-w-md w-full text-center border-slate-200 shadow-md">
        <CardHeader className="pb-2">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl text-slate-900">Access Restricted</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            This area is restricted to the Pharmacy Owner / Administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <p className="text-sm text-slate-600 leading-relaxed">
            As a dispensing pharmacist, your account is configured for sales recording, inventory dispensing, and managing active shifts. Administrative functions (such as staff account provisioning and system security logs) require owner privileges.
          </p>

          <a
            href="/dashboard"
            className="inline-flex items-center justify-center w-full h-11 px-4 text-sm font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Dashboard
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
