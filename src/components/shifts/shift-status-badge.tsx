'use client';

import React, { useState } from 'react';
import { Clock, Plus, LogOut, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OpenShiftModal } from './open-shift-modal';
import { CloseShiftModal } from './close-shift-modal';
import type { ShiftSummary } from '@/types';

interface ShiftStatusBadgeProps {
  activeShift: ShiftSummary | null;
  currentUserId: string;
}

export function ShiftStatusBadge({ activeShift, currentUserId }: ShiftStatusBadgeProps) {
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        {activeShift ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <div className="leading-tight">
              <span className="font-bold">Active Shift:</span>{' '}
              <span className="font-medium text-emerald-950">{activeShift.user?.full_name}</span>
            </div>

            <div className="flex items-center gap-1 ml-2 border-l border-emerald-200 pl-2">
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(true)}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 rounded-md transition-colors"
                title="Close Shift"
              >
                Close Shift
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
            <span className="font-semibold">No Active Shift</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOpenModalOpen(true)}
              className="h-6 px-2 text-[11px] font-bold border-amber-300 text-amber-900 hover:bg-amber-100 ml-1"
            >
              <Plus className="w-3 h-3 mr-1" /> Open Shift
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <OpenShiftModal
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {activeShift && (
        <CloseShiftModal
          isOpen={isCloseModalOpen}
          onClose={() => setIsCloseModalOpen(false)}
          shiftSummary={activeShift}
          onSuccess={() => window.location.reload()}
        />
      )}
    </>
  );
}
