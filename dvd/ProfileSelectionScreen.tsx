import React, { useState } from 'react';
import type { Profile } from '../types';
import { AVATAR_MAP, AVATAR_NAMES } from './icons/Avatars';
import { CloseIcon } from './icons/CloseIcon';

interface ProfileSelectionScreenProps {
  profiles: Profile[];
  onProfileSelected: (profileId: string) => void;
  onProfileCreated: (name: string, avatar: string) => void;
  onProfileUpdated: (profileId: string, name: string, avatar: string) => void;
  onProfileDeleted: (profileId: string) => void;
}

// A simple + icon for the add profile card
const AddIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
  </svg>
);

const DeleteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const ProfileSelectionScreen: React.FC<ProfileSelectionScreenProps> = ({ profiles, onProfileSelected, onProfileCreated, onProfileUpdated, onProfileDeleted }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_NAMES[0]);
  const [showCreation, setShowCreation] = useState(profiles.length === 0);
  
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedAvatar) {
      onProfileCreated(name.trim(), selectedAvatar);
    }
  };
  
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProfile && name.trim() && selectedAvatar) {
      onProfileUpdated(editingProfile.id, name.trim(), selectedAvatar);
      setEditingProfile(null);
    }
  };

  const openEditModal = (profile: Profile) => {
    setEditingProfile(profile);
    setName(profile.name);
    setSelectedAvatar(profile.avatar);
  };

  const handleDelete = (profile: Profile) => {
    if (window.confirm(`Are you sure you want to delete the profile for "${profile.name}"? This cannot be undone.`)) {
      onProfileDeleted(profile.id);
    }
  };


  if (showCreation) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-4 animate-fade-in">
        <div className="w-full max-w-md text-center bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-slate-700">
          <h1 className="text-4xl font-bold text-white mb-2">{profiles.length > 0 ? 'Create New Profile' : 'Welcome! Create Your Profile'}</h1>
          <p className="text-slate-300 mb-8">Choose a name and an avatar to get started.</p>
          <form onSubmit={handleCreate}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-5 py-3 text-lg text-white bg-slate-700/80 rounded-full border-2 border-slate-600 placeholder-slate-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-500/50 focus:border-cyan-500 transition mb-6"
              maxLength={15}
              required
            />
            <div className="grid grid-cols-4 gap-4 mb-8">
              {AVATAR_NAMES.map(avatarKey => {
                const AvatarComponent = AVATAR_MAP[avatarKey];
                return (
                  <button
                    key={avatarKey}
                    type="button"
                    onClick={() => setSelectedAvatar(avatarKey)}
                    className={`rounded-2xl transition-all duration-200 p-1 ${selectedAvatar === avatarKey ? 'ring-4 ring-cyan-500 bg-cyan-500/20' : 'bg-slate-700 hover:bg-slate-600'}`}
                  >
                    <AvatarComponent className="w-full h-full rounded-lg" />
                  </button>
                )
              })}
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-cyan-500 text-white font-bold text-xl rounded-lg shadow-lg border-b-4 border-cyan-700 hover:bg-cyan-400 active:border-b-0 active:translate-y-1 transition-all duration-150 disabled:bg-slate-500 disabled:border-slate-600 disabled:text-slate-400"
              disabled={!name.trim()}
            >
              Let's Play!
            </button>
            {profiles.length > 0 && (
                <button
                    type="button"
                    onClick={() => setShowCreation(false)}
                    className="mt-4 text-sm text-slate-400 hover:underline"
                >
                    Back to profile selection
                </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  if (editingProfile) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="relative w-full max-w-md text-center bg-slate-800 rounded-2xl shadow-xl p-8 border-2 border-slate-700">
            <button onClick={() => setEditingProfile(null)} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-700 transition-colors z-10">
                <CloseIcon className="w-7 h-7 text-slate-300" />
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">Edit Profile</h1>
            <p className="text-slate-300 mb-8">Update the name and avatar.</p>
            <form onSubmit={handleUpdate}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-5 py-3 text-lg text-white bg-slate-700/80 rounded-full border-2 border-slate-600 placeholder-slate-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-500/50 focus:border-cyan-500 transition mb-6"
                maxLength={15}
                required
              />
              <div className="grid grid-cols-4 gap-4 mb-8">
                {AVATAR_NAMES.map(avatarKey => {
                  const AvatarComponent = AVATAR_MAP[avatarKey];
                  return (
                    <button
                      key={avatarKey}
                      type="button"
                      onClick={() => setSelectedAvatar(avatarKey)}
                      className={`rounded-2xl transition-all duration-200 p-1 ${selectedAvatar === avatarKey ? 'ring-4 ring-cyan-500 bg-cyan-500/20' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                      <AvatarComponent className="w-full h-full rounded-lg" />
                    </button>
                  )
                })}
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-cyan-500 text-white font-bold text-xl rounded-lg shadow-lg border-b-4 border-cyan-700 hover:bg-cyan-400 active:border-b-0 active:translate-y-1 transition-all duration-150 disabled:bg-slate-500 disabled:border-slate-600 disabled:text-slate-400"
                disabled={!name.trim()}
              >
                Save Changes
              </button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-4 animate-fade-in">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-5xl font-bold text-white mb-4">Who's Playing?</h1>
         {profiles.length > 0 && (
            <button onClick={() => setIsEditingMode(prev => !prev)} className="mb-8 px-6 py-2 bg-slate-700 text-cyan-400 font-bold rounded-full hover:bg-slate-600 transition-colors">
              {isEditingMode ? 'Done' : 'Edit Profiles'}
            </button>
          )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {profiles.map(profile => {
            const AvatarComponent = AVATAR_MAP[profile.avatar];
            return (
              <div key={profile.id} className="relative">
                <button
                  onClick={() => !isEditingMode && onProfileSelected(profile.id)}
                  disabled={isEditingMode}
                  className="group flex flex-col items-center gap-2 p-4 bg-slate-800/70 rounded-2xl shadow-lg border-2 border-slate-700 w-full transition-all hover:-translate-y-2 enabled:hover:border-cyan-500"
                >
                  <div className="w-24 h-24 rounded-full p-1 bg-slate-600 transition-colors group-hover:bg-cyan-500/50">
                      {AvatarComponent && <AvatarComponent className="w-full h-full rounded-full" />}
                  </div>
                  <span className="font-bold text-lg text-white truncate w-full">{profile.name}</span>
                </button>
                {isEditingMode && (
                  <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center gap-4 animate-fade-in">
                      <button onClick={() => openEditModal(profile)} className="p-3 bg-slate-600 rounded-full hover:bg-blue-500 text-white" aria-label={`Edit ${profile.name}'s profile`}><EditIcon className="w-6 h-6" /></button>
                      <button onClick={() => handleDelete(profile)} className="p-3 bg-slate-600 rounded-full hover:bg-red-500 text-white" aria-label={`Delete ${profile.name}'s profile`}><DeleteIcon className="w-6 h-6" /></button>
                  </div>
                )}
              </div>
            )
          })}
          {/* Add New Profile Card */}
          <button
            onClick={() => setShowCreation(true)}
            className="group flex flex-col items-center justify-center gap-2 p-4 bg-slate-800/70 rounded-2xl shadow-lg border-2 border-dashed border-slate-600 hover:border-cyan-500 hover:bg-slate-700/50 transition-all hover:-translate-y-2"
            aria-label="Add a new profile"
          >
            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-slate-700 transition-colors group-hover:bg-slate-600">
                <AddIcon className="h-12 w-12 text-slate-500 group-hover:text-cyan-400 transition-colors"/>
            </div>
            <span className="font-bold text-lg text-slate-400 group-hover:text-white transition-colors">Add New</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelectionScreen;