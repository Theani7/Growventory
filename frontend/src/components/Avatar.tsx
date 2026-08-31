type AvatarProps = {
  username?: string;
  size?: number; // tailwind w-xxx h-xxx via className, but keep size for URL
  className?: string;
  variant?: 'adventurer' | 'initials' | 'micah';
};

const BGS = 'eef6ee,d6ead6,b7d8b7';

// Illustrated avatar via DiceBear — seeded by username, deterministic, no auth
// Using adventurer (illustrated) with soft forest palette to match editorial theme
export const Avatar = ({ username = 'U', size = 36, className = '', variant = 'adventurer' }: AvatarProps) => {
  const seed = encodeURIComponent(username.trim() || 'user');
  // adventurer gives illustrated characters; initials fallback is more minimal but still illustrated via background
  const style = variant === 'initials' ? 'initials' : variant === 'micah' ? 'micah' : 'adventurer';
  const url =
    style === 'initials'
      ? `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=${BGS}&textColor=1d4d2e,1a3a2a&fontWeight=700`
      : `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=${BGS}&radius=12&size=${size}`;

  return (
    <img
      src={url}
      alt={username}
      width={size}
      height={size}
      loading="lazy"
      className={`object-cover bg-[#eef6ee] ${className}`}
      onError={(e) => {
        // fallback to initials if illustrator fails
        const t = e.currentTarget;
        t.onerror = null;
        t.src = `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=${BGS}&textColor=1d4d2e`;
      }}
    />
  );
};

// Simple initial fallback (no network) — kept for offline
export const InitialAvatar = ({ username = 'U', className = '' }: { username?: string; className?: string }) => (
  <div className={`bg-[#eef6ee] border border-[#d6ead6] text-[#1d4d2e] flex items-center justify-center font-bold ${className}`}>
    {username.charAt(0).toUpperCase()}
  </div>
);

export default Avatar;
