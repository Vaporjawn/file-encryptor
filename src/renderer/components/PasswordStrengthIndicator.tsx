import React from 'react';

export function calculateEntropy(password: string): number {
  let charset = 0;
  if (/[a-z]/.test(password)) charset += 26;
  if (/[A-Z]/.test(password)) charset += 26;
  if (/[0-9]/.test(password)) charset += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charset += 32;
  return password.length * (charset ? Math.log2(charset) : 0);
}

export function getStrengthLevel(entropy: number): string {
  if (entropy > 80) return 'Strong';
  if (entropy > 60) return 'Good';
  if (entropy > 40) return 'Weak';
  return 'Very Weak';
}

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const entropy = calculateEntropy(password);
  const strength = getStrengthLevel(entropy);
  let color = 'red';
  if (strength === 'Strong') color = 'green';
  else if (strength === 'Good') color = 'orange';

  return (
    <div style={{ marginTop: 8 }}>
      <span>Password strength: </span>
      <span style={{ color }}>
        {strength} ({entropy.toFixed(1)} bits)
      </span>
    </div>
  );
}
