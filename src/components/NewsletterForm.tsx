'use client';

import { useState } from 'react';
import { Confetti } from './Confetti';

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'duplicate';

/** Detect "already subscribed" / duplicate responses from the upstream API. */
function isDuplicateError(body: { error?: string; message?: string; code?: string }): boolean {
  const msg = `${body?.error || ''} ${body?.message || ''} ${body?.code || ''}`.toLowerCase();
  if (!msg) return false;
  return (
    msg.includes('already') ||
    msg.includes('duplicate') ||
    msg.includes('exists') ||
    msg.includes('unique') ||
    msg.includes('23505') // Postgres unique violation
  );
}

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [burstKey, setBurstKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;

    setStatus('submitting');
    setError('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok || body?.success === false) {
        if (isDuplicateError(body)) {
          setStatus('duplicate');
          setError('already registered');
          setTimeout(() => setStatus('idle'), 4000);
          return;
        }
        setStatus('error');
        setError(body?.error || body?.message || 'submission failed');
        return;
      }

      setStatus('success');
      setEmail('');
      setBurstKey(k => k + 1);
      // Reset UI after a few seconds so a second subscriber can use the same form
      setTimeout(() => setStatus('idle'), 4000);
    } catch {
      setStatus('error');
      setError('network error');
    }
  };

  const placeholder =
    status === 'success'
      ? 'access request received'
      : status === 'duplicate'
      ? 'already registered'
      : status === 'submitting'
      ? 'transmitting…'
      : 'enter access code (email)';

  const buttonLabel =
    status === 'success' ? 'Logged'
    : status === 'duplicate' ? 'Known'
    : status === 'submitting' ? '…'
    : 'Request';

  const buttonColor =
    status === 'success' ? 'var(--accent)'
    : status === 'duplicate' ? '#ffc157'
    : undefined;

  return (
    <>
      <Confetti burstKey={burstKey} />
      <form className="email-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder={placeholder}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          disabled={status === 'submitting' || status === 'success'}
        />
        <button
          type="submit"
          disabled={status === 'submitting' || status === 'success'}
          style={buttonColor ? { color: buttonColor } : undefined}
        >
          {buttonLabel}
        </button>
      </form>
      {(status === 'error' || status === 'duplicate') && (
        <div className="form-error" style={status === 'duplicate' ? { color: '#ffc157' } : undefined}>
          {status === 'duplicate' ? 'this email is already on the list' : error}
        </div>
      )}
    </>
  );
}
