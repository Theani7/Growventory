import { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';

const Tooltip = ({ text, children, icon = 'info', position = 'top' }) => {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const iconComponent = icon === 'info' ? <Info className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />;

  return (
    <div className="relative inline-block">
      <div
        className="inline-flex items-center justify-center"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        {children || (
          <button
            type="button"
            className="text-ink-400 hover:text-ink-700 focus:outline-none focus:ring-2 focus:ring-ink-300 rounded-full p-1 transition-colors"
            aria-label={`Help: ${text}`}
          >
            {iconComponent}
          </button>
        )}
      </div>
      
      {visible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} px-3 py-1.5 bg-ink-950 text-white text-xs font-semibold rounded-lg shadow-elevated-lg whitespace-nowrap pointer-events-none ring-1 ring-white/10`}
          role="tooltip"
        >
          {text}
          <div className={`absolute w-2 h-2 bg-ink-950 transform rotate-45 ${
            position === 'top' ? 'top-full -translate-x-1/2 left-1/2 -mt-1' :
            position === 'bottom' ? 'bottom-full -translate-x-1/2 left-1/2 -mb-1' :
            position === 'left' ? 'left-full -translate-y-1/2 top-1/2 -ml-1' :
            'right-full -translate-y-1/2 top-1/2 -mr-1'
          }`} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
