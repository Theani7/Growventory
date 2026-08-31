type AvatarProps = {
  username?: string;
  className?: string;
  size?: number;
  variant?: string;
};

// Minimal editorial — off-white forest tint, no gradients, no external images
// Matches landing/auth #eef6ee / #d6ead6 / #1d4d2e calm palette
export const Avatar = ({ username = 'U', className = '' }: AvatarProps) => {
  return (
    <div
      className={`flex items-center justify-center font-bold bg-[#eef6ee] border border-[#d6ead6] text-[#1d4d2e] select-none ${className}`}
      aria-label={username}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  );
};

export default Avatar;
