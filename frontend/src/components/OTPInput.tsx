import { useRef, useEffect } from 'react';

type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
};

const OTPInput = ({ value, onChange, length = 4, disabled }: OTPInputProps) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current = inputsRef.current.slice(0, length);
  }, [length]);

  const handleChange = (index: number, val: string) => {
    if (disabled) return;
    // Only digits
    const digit = val.replace(/\D/g, '').slice(-1);
    const newValue = value.split('');
    // Ensure length
    while (newValue.length < length) newValue.push('');
    newValue[index] = digit;
    // Pad to length
    const joined = newValue.join('').slice(0, length);
    onChange(joined);

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move back
        const newValue = value.split('');
        newValue[index - 1] = '';
        onChange(newValue.join('').slice(0, length));
        inputsRef.current[index - 1]?.focus();
        e.preventDefault();
      } else if (value[index]) {
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join('').slice(0, length));
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted.padEnd(length, '').slice(0, length));
      // Focus last filled
      const nextIndex = Math.min(pasted.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-14 h-14 text-center text-2xl font-bold tracking-widest bg-white border-2 border-gray-200 rounded-xl focus:border-forest-500 focus:ring-4 focus:ring-forest-500/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
      ))}
    </div>
  );
};

export default OTPInput;
