import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { UserRole, VerificationStatus } from '../../types.ts';

interface UserUIDBadgeProps {
  uid: string;
  role?: UserRole | 'INSTITUTION';
  verificationStatus?: VerificationStatus;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const UserUIDBadge: React.FC<UserUIDBadgeProps> = ({
  uid,
  role,
  verificationStatus = 'VERIFIED',
  isVerified = true,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  // Determine role label if not explicitly passed
  let roleLabel = 'MEMBER';
  if (role) {
    if (role === 'STUDENT') roleLabel = 'STUDENT';
    else if (role === 'ALUMNI') roleLabel = 'ALUMNI';
    else if (role === 'FACULTY') roleLabel = 'FACULTY';
    else if (role === 'INSTITUTION_ADMIN') roleLabel = 'INSTITUTION ADMIN';
    else if (role === 'SUPER_ADMIN') roleLabel = 'PLATFORM ADMIN';
    else if (role === 'INSTITUTION') roleLabel = 'INSTITUTION';
  } else if (uid.startsWith('AN-STU')) {
    roleLabel = 'STUDENT';
  } else if (uid.startsWith('AN-ALU')) {
    roleLabel = 'ALUMNI';
  } else if (uid.startsWith('AN-FAC')) {
    roleLabel = 'FACULTY';
  } else if (uid.startsWith('AN-IAD')) {
    roleLabel = 'INSTITUTION ADMIN';
  } else if (uid.startsWith('AN-ADM')) {
    roleLabel = 'PLATFORM ADMIN';
  } else if (uid.startsWith('AN-INS')) {
    roleLabel = 'INSTITUTION';
  }

  // Theme styling based on role and status
  const isNotVerified = verificationStatus === 'NOT_VERIFIED' || (isVerified === false && verificationStatus !== 'PENDING' && verificationStatus !== 'UNDER_REVIEW');
  const isPending = verificationStatus === 'PENDING';
  const isUnderReview = verificationStatus === 'UNDER_REVIEW';
  const isRejected = verificationStatus === 'REJECTED';

  let badgeBorder = 'border-[#E6E1D7]';
  let badgeBg = 'bg-[#FAF8F5]';
  let badgeText = 'text-[#1F242D]';
  let statusBg = 'bg-[#EBF2EA] text-[#3D5B3B] border-[#D0E2CE]';
  let statusText = `✓ VERIFIED ${roleLabel}`;

  if (isNotVerified) {
    statusBg = 'bg-[#FFF0EB] text-[#C2410C] border-[#FED7AA]';
    statusText = `NOT VERIFIED`;
  } else if (isPending) {
    statusBg = 'bg-[#FFF6E5] text-[#8C6212] border-[#FFE6B3]';
    statusText = `PENDING ${roleLabel}`;
  } else if (isUnderReview) {
    statusBg = 'bg-[#E9F1F8] text-[#29527A] border-[#CFE1F0]';
    statusText = `UNDER REVIEW`;
  } else if (isRejected) {
    statusBg = 'bg-[#FBEAEA] text-[#932F2F] border-[#F4C5C5]';
    statusText = `UNVERIFIED`;
  } else {
    // Verified color variations by role
    if (roleLabel === 'STUDENT') {
      statusBg = 'bg-[#E9F1F8] text-[#2A537A] border-[#D2E2F0]';
    } else if (roleLabel === 'ALUMNI') {
      statusBg = 'bg-[#EBF2EA] text-[#345932] border-[#CFE2CD]';
    } else if (roleLabel === 'FACULTY') {
      statusBg = 'bg-[#F1EDF7] text-[#553E7A] border-[#DDD5EB]';
    } else if (roleLabel === 'INSTITUTION ADMIN' || roleLabel === 'PLATFORM ADMIN') {
      statusBg = 'bg-[#F8EFEA] text-[#784433] border-[#EDD5CC]';
    } else if (roleLabel === 'INSTITUTION') {
      statusBg = 'bg-[#EBF2EA] text-[#2E582C] border-[#CCE0CA]';
    }
  }

  const paddingClass =
    size === 'sm' ? 'px-2 py-0.5 text-[10px]' :
    size === 'lg' ? 'px-3.5 py-1.5 text-xs' :
    'px-2.5 py-1 text-[11px]';

  // Completely remove "✓ VERIFIED INSTITUTION ADMIN", "✓ VERIFIED ALUMNI", and "✓ VERIFIED INSTITUTION" tags everywhere
  if (roleLabel === 'INSTITUTION ADMIN' || roleLabel === 'ALUMNI' || roleLabel === 'INSTITUTION') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-mono ${className}`}>
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-md border border-[#E6E1D7] bg-[#F7F5F0] text-[#1F242D] tracking-wide ${paddingClass}`}
          title={`UID: ${uid}`}
        >
          <span className="text-[#7E8696] select-none font-sans font-normal text-[10px]">UID:</span>
          <span className="font-semibold text-[#1F242D]">{uid}</span>
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono ${className}`}>
      {showLabel && (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md border tracking-wider uppercase ${paddingClass} ${statusBg}`}
        >
          {isNotVerified ? (
            <AlertTriangle className="w-3 h-3 text-[#C2410C]" />
          ) : isPending || isUnderReview ? (
            <Clock className="w-3 h-3" />
          ) : isRejected ? (
            <XCircle className="w-3 h-3" />
          ) : (
            <ShieldCheck className="w-3 h-3" />
          )}
          <span>{statusText}</span>
        </span>
      )}
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-md border border-[#E6E1D7] bg-[#F7F5F0] text-[#1F242D] tracking-wide ${paddingClass}`}
        title={`UID: ${uid}`}
      >
        <span className="text-[#7E8696] select-none font-sans font-normal text-[10px]">UID:</span>
        <span className="font-semibold text-[#1F242D]">{uid}</span>
      </span>
    </span>
  );
};
