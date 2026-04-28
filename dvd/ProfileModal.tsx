
import React, { useState } from 'react';
import type { Profile } from '../types';
import { AVATAR_MAP } from './icons/Avatars';
import { AddUserIcon } from './icons/AddUserIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SwitchUserIcon } from './icons/SwitchUserIcon';
import { UserIcon } from './icons/UserIcon';

interface ProfileModalProps {
  profile: Profile;
  profiles: Profile[];
  onClose: () => void;
  onManageAccount: () => void;
  onAddAccount: () => void;
  onSwitchProfile: (profileId: string) => void;
  onSignOut: () => void;
}

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );

const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  profiles,
  onClose,
  onManageAccount,
  onAddAccount,
  onSwitchProfile,
  onSignOut,
}) => {
  const AvatarComponent = AVATAR_MAP[profile.avatar];
  const [showSwitchList, setShowSwitchList] = useState(false);

  const otherProfiles = profiles.filter(p => p.id !== profile.id);

  const ActionButton: React.FC<{ onClick: () => void, children: React.ReactNode, className?: string, 'aria-expanded'?: boolean }> = ({ onClick, children, className = '', ...props }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-800/70 rounded-lg hover:bg-slate-700/90 transition-colors text-slate-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute top-4 right-4 bg-slate-900/90 rounded-2xl shadow-2xl shadow-cyan-500/10 w-full max-w-sm m-4 p-6 flex flex-col border border-slate-700"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 2rem)'}}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          aria-label="Close profile menu"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* --- Profile Header --- */}
        <div className="flex flex-col items-center shrink-0 mb-6">
          {AvatarComponent && (
            <div className="w-28 h-28 rounded-full p-2 bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg mb-4">
              <AvatarComponent className="w-full h-full rounded-full" />
            </div>
          )}
          <h2 className="text-3xl font-bold text-white">Hi, {profile.name}!</h2>
          <p className="text-slate-400 text-sm mt-1">{`${profile.name.toLowerCase().replace(/\s/g,'.')}@kidsgames.fun`}</p>
        </div>

        {/* --- Scrollable Action List --- */}
        <div className="w-full space-y-2 text-white overflow-y-auto pr-2 -mr-4 flex-grow">
          <ActionButton onClick={onManageAccount}>
            <div className="flex items-center gap-4">
              <UserIcon className="w-6 h-6 text-cyan-400" />
              <span className="font-semibold">Manage Profile & Scores</span>
            </div>
          </ActionButton>

          <div>
            <ActionButton onClick={() => setShowSwitchList(s => !s)} aria-expanded={showSwitchList}>
              <div className="flex items-center gap-4">
                  <SwitchUserIcon className="w-6 h-6 text-cyan-400" />
                  <span className="font-semibold">Switch Profile</span>
              </div>
              <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform ${showSwitchList ? 'rotate-180' : ''}`} />
            </ActionButton>
            
            {showSwitchList && (
              <div className="pl-6 mt-1 space-y-1 animate-fade-in">
                {otherProfiles.length > 0 ? (
                  otherProfiles.map(p => {
                      const OtherAvatar = AVATAR_MAP[p.avatar];
                      return (
                          <button key={p.id} onClick={() => onSwitchProfile(p.id)} className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800/60 rounded-lg hover:bg-slate-700/80 transition-colors text-left">
                              {OtherAvatar && <div className="w-10 h-10 rounded-full shrink-0"><OtherAvatar className="w-full h-full rounded-full" /></div>}
                              <span className="font-semibold truncate">{p.name}</span>
                          </button>
                      )
                  })
                ) : (
                  <div className="px-4 py-3 text-slate-400 text-sm text-center">No other profiles to switch to.</div>
                )}
              </div>
            )}
          </div>
          
          <ActionButton onClick={onAddAccount}>
            <div className="flex items-center gap-4">
              <AddUserIcon className="w-6 h-6 text-cyan-400" />
              <span className="font-semibold">Add Account</span>
            </div>
          </ActionButton>
          
          <ActionButton onClick={onSignOut} className="hover:bg-red-900/40 !text-red-400">
            <div className="flex items-center gap-4">
              <LogoutIcon className="w-6 h-6" />
              <span className="font-semibold">Sign Out</span>
            </div>
          </ActionButton>
        </div>

        {/* --- Footer --- */}
        <div className="text-xs text-slate-500 mt-6 border-t border-slate-700/50 w-full pt-4 text-center shrink-0">
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="mx-2">&middot;</span>
            <span className="hover:underline cursor-pointer">Terms of Service</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
