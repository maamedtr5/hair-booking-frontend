import { Eye, EyeOff } from 'lucide-react';

interface PasswordToggleButtonProps {
  shown: boolean;
  onToggle: () => void;
}

// Shared by LoginPage and RegisterPage (previously duplicated inline in
// both, each with its own copy of the emoji eye icon). Single source of
// truth for the show/hide-password control now.
export function PasswordToggleButton({ shown, onToggle }: PasswordToggleButtonProps) {
  return (
    <button
      type="button"
      className="password-toggle"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
    >
      {shown ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
    </button>
  );
}
