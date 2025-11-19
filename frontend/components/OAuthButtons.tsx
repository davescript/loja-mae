import { MouseEvent } from 'react';

export type OAuthProvider = 'google' | 'microsoft' | 'apple';

interface OAuthButtonsProps {
  onSelect: (provider: OAuthProvider) => void;
  disabledProviders?: OAuthProvider[];
  className?: string;
}

const providers: Array<{
  id: OAuthProvider;
  label: string;
  icon: JSX.Element;
}> = [
  {
    id: 'google',
    label: 'Continuar com Google',
    icon: <GoogleIcon />,
  },
  {
    id: 'microsoft',
    label: 'Continuar com Microsoft',
    icon: <MicrosoftIcon />,
  },
  {
    id: 'apple',
    label: 'Continuar com Apple',
    icon: <AppleIcon />,
  },
];

export default function OAuthButtons({
  onSelect,
  disabledProviders = [],
  className = '',
}: OAuthButtonsProps) {
  const disabledSet = new Set(disabledProviders);

  const handleClick = (event: MouseEvent<HTMLButtonElement>, provider: OAuthProvider) => {
    event.preventDefault();
    if (!disabledSet.has(provider)) {
      onSelect(provider);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {providers.map((provider) => {
        const isDisabled = disabledSet.has(provider.id);
        return (
          <button
            key={provider.id}
            onClick={(event) => handleClick(event, provider.id)}
            disabled={isDisabled}
            className={`w-full flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-neutral-800 px-4 py-3 text-white text-base font-medium transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
              isDisabled
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:-translate-y-0.5 hover:bg-neutral-700'
            }`}
          >
            <span className="h-5 w-5 flex items-center justify-center">{provider.icon}</span>
            <span>{provider.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6 1.54 7.38 2.83l5.42-5.42C33.64 3.05 29.19 1 24 1 14.91 1 7.03 6.64 4.24 15.07l6.91 5.36C12.45 14.5 17.79 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.56-.14-3.05-.41-4.5H24v8.52h12.7c-.55 2.96-2.23 5.47-4.7 7.15l7.59 5.89c4.43-4.09 6.91-10.1 6.91-17.06z"
      />
      <path
        fill="#FBBC05"
        d="M10.15 28.43A14.5 14.5 0 019.5 24c0-1.54.27-3.03.74-4.43l-6.91-5.36A23.93 23.93 0 000 24c0 3.8.91 7.38 2.52 10.56l7.63-6.13z"
      />
      <path
        fill="#34A853"
        d="M24 46c6.48 0 11.91-2.14 15.88-5.9l-7.59-5.89c-2.11 1.42-4.82 2.25-8.29 2.25-6.21 0-11.49-3.93-13.45-9.42l-7.63 6.13C5.26 39.81 14.03 46 24 46z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
      <span className="bg-[#f1511b] rounded-sm" />
      <span className="bg-[#80cc28] rounded-sm" />
      <span className="bg-[#00a1f1] rounded-sm" />
      <span className="bg-[#fbbc05] rounded-sm" />
    </div>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" className="h-5 w-5 fill-white">
      <path d="M16.365 1.43c0 1.02-.416 1.892-1.14 2.484-.722.595-1.685 1.062-2.483 1.062-.095-.008-.194-.017-.29-.017-.077 0-.15.009-.219.017.038-.618.331-1.348.802-1.892.53-.603 1.216-.98 1.975-.98.488 0 .955.17 1.307.428-.06.243-.103.493-.103.55zm4.901 14.11c-.388-.803-.83-1.575-1.325-2.26-.722-1.006-1.525-2.158-2.395-2.158-.81 0-1.145.486-2.167.486-.997 0-1.5-.477-2.282-.477-.876 0-1.553.544-2.144 1.144-1.093 1.142-1.897 2.756-1.897 4.511 0 1.52.52 3.021 1.461 4.3.651.898 1.465 1.93 2.538 1.93.882 0 1.244-.553 2.328-.553 1.106 0 1.398.553 2.354.553 1.095 0 1.767-.912 2.414-1.785.528-.728.908-1.424 1.157-1.928.183-.366.266-.682.266-.682-.017-.009-1.574-.6-1.594-2.183z" />
    </svg>
  );
}

