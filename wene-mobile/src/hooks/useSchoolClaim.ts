/**
 * 学校参加券クレームロジック
 *
 * deps 経由で eventProvider / claimClient を使用。
 * already は success と同等に扱い、onSuccess で success 画面へ遷移する。
 */

import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { submitSchoolClaim } from '../api/schoolClaim';
import { getSchoolDeps } from '../api/createSchoolDeps';
import { getOrCreateJoinTokenWeb } from '../lib/joinToken';
import { useRecipientTicketStore } from '../store/recipientTicketStore';
import type { SchoolEvent } from '../types/school';
import type { SchoolClaimErrorInfo, SchoolClaimResultSuccess } from '../types/school';

export type SchoolClaimStatus = 'idle' | 'loading' | 'success' | 'already' | 'error';

export interface UseSchoolClaimOptions {
  onSuccess?: (result: SchoolClaimResultSuccess) => void;
}

export interface UseSchoolClaimResult {
  status: SchoolClaimStatus;
  errorInfo: SchoolClaimErrorInfo | null;
  error: string | null;
  isRetryable: boolean;
  event: SchoolEvent | null;
  isJoined: boolean;
  handleClaim: () => Promise<void>;
  reset: () => void;
}

export function useSchoolClaim(
  eventId: string | undefined,
  options?: UseSchoolClaimOptions
): UseSchoolClaimResult {
  const [status, setStatus] = useState<SchoolClaimStatus>('idle');
  const [errorInfo, setErrorInfo] = useState<SchoolClaimErrorInfo | null>(null);
  const [event, setEvent] = useState<SchoolEvent | null>(null);
  const { isJoined } = useRecipientTicketStore();
  const onSuccess = options?.onSuccess;

  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      return;
    }
    let cancelled = false;
    getSchoolDeps()
      .eventProvider.getById(eventId)
      .then((ev) => {
        if (!cancelled) setEvent(ev ?? null);
      })
      .catch(() => {
        if (!cancelled) setEvent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const handleClaim = useCallback(async () => {
    if (!eventId || !event) return;
    setStatus('loading');
    setErrorInfo(null);

    const options =
      Platform.OS === 'web'
        ? { joinToken: getOrCreateJoinTokenWeb() ?? undefined }
        : undefined;
    const result = await submitSchoolClaim(eventId, options);

    if (result.success) {
      if (result.alreadyJoined) {
        setStatus('already');
      } else {
        setStatus('success');
      }
      onSuccess?.(result);
    } else {
      setStatus('error');
      setErrorInfo(result.error);
    }
  }, [eventId, event, onSuccess]);

  const reset = useCallback(() => {
    setStatus('idle');
    setErrorInfo(null);
  }, []);

  return {
    status,
    errorInfo,
    error: errorInfo?.message ?? null,
    isRetryable: errorInfo?.code === 'retryable' || errorInfo?.code === 'wallet_required',
    event,
    isJoined: eventId ? isJoined(eventId) : false,
    handleClaim,
    reset,
  };
}
