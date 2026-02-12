import { useState, useEffect, useCallback } from "react";
import {
  Profile,
  getProfiles,
  saveProfiles,
  addProfile as addProfileToStorage,
  updateProfile as updateProfileInStorage,
  deleteProfile as deleteProfileFromStorage,
  getCurrentProfile,
  getCurrentProfileId,
  setCurrentProfile as setCurrentProfileInStorage,
  clearCurrentProfile,
  DEFAULT_AVATARS,
} from "@/lib/storage";

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfileState] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profiles on mount
  useEffect(() => {
    const loadedProfiles = getProfiles();
    setProfiles(loadedProfiles);
    
    const current = getCurrentProfile();
    setCurrentProfileState(current);
    
    setIsLoading(false);
  }, []);

  const addProfile = useCallback((name: string, avatar: string, isKids = false) => {
    try {
      const newProfile = addProfileToStorage({ name, avatar, isKids });
      setProfiles(prev => [...prev, newProfile]);
      return newProfile;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateProfile = useCallback((id: string, updates: { name?: string; avatar?: string; isKids?: boolean }) => {
    const updated = updateProfileInStorage(id, updates);
    if (updated) {
      setProfiles(prev => prev.map(p => p.id === id ? updated : p));
      if (currentProfile?.id === id) {
        setCurrentProfileState(updated);
      }
    }
    return updated;
  }, [currentProfile]);

  const deleteProfile = useCallback((id: string) => {
    const success = deleteProfileFromStorage(id);
    if (success) {
      setProfiles(prev => prev.filter(p => p.id !== id));
      if (currentProfile?.id === id) {
        setCurrentProfileState(null);
      }
    }
    return success;
  }, [currentProfile]);

  const selectProfile = useCallback((profileId: string) => {
    setCurrentProfileInStorage(profileId);
    const profile = profiles.find(p => p.id === profileId);
    setCurrentProfileState(profile || null);
  }, [profiles]);

  const signOut = useCallback(() => {
    clearCurrentProfile();
    setCurrentProfileState(null);
  }, []);

  const canAddProfile = profiles.length < 5;

  return {
    profiles,
    currentProfile,
    isLoading,
    addProfile,
    updateProfile,
    deleteProfile,
    selectProfile,
    signOut,
    canAddProfile,
    defaultAvatars: DEFAULT_AVATARS,
  };
}
