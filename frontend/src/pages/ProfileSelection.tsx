import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/hooks/useProfiles";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProfileSelection() {
  const navigate = useNavigate();
  const {
    profiles,
    currentProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    selectProfile,
    canAddProfile,
    defaultAvatars,
    isLoading,
  } = useProfiles();

  const [isManageMode, setIsManageMode] = useState(false);

  // Create default profile on first load
  React.useEffect(() => {
    if (!isLoading && profiles.length === 0) {
      const defaultProfile = {
        name: 'Profile 1',
        avatar: defaultAvatars[0],
        isKids: false,
      };
      addProfile(defaultProfile.name, defaultProfile.avatar, defaultProfile.isKids);
    }
  }, [isLoading, profiles.length, addProfile, defaultAvatars]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(defaultAvatars[0]);
  const [isKids, setIsKids] = useState(false);

  // If already has a profile selected, redirect to home
  React.useEffect(() => {
    if (currentProfile) {
      navigate("/browse");
    }
  }, [currentProfile, navigate]);

  // Execute popunder ad on page load
  React.useEffect(() => {
    const loadAd = async () => {
      const { executePopunderAd } = await import('@/lib/adLoader');
      executePopunderAd();
    };
    loadAd();
  }, []);

  const handleProfileClick = (profileId: string) => {
    if (isManageMode) {
      setSelectedProfileId(profileId);
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        setNewProfileName(profile.name);
        setSelectedAvatar(profile.avatar);
        setIsKids(profile.isKids);
        setIsEditDialogOpen(true);
      }
    } else {
      selectProfile(profileId);
      navigate("/browse");
    }
  };

  const handleAddProfile = () => {
    if (!newProfileName.trim()) return;

    // Check if name is taken (case insensitive)
    const isDuplicate = profiles.some(p => p.name.toLowerCase() === newProfileName.trim().toLowerCase());
    if (isDuplicate) {
      alert(`The name "${newProfileName}" is already taken.`);
      return;
    }

    try {
      addProfile(newProfileName.trim(), selectedAvatar, isKids);
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add profile:", error);
    }
  };

  const handleUpdateProfile = () => {
    if (!selectedProfileId || !newProfileName.trim()) return;

    const isDuplicate = profiles.some(p =>
      p.id !== selectedProfileId &&
      p.name.toLowerCase() === newProfileName.trim().toLowerCase()
    );

    if (isDuplicate) {
      alert(`The name "${newProfileName}" is already taken.`);
      return;
    }

    updateProfile(selectedProfileId, {
      name: newProfileName.trim(),
      avatar: selectedAvatar,
      isKids,
    });
    resetForm();
    setIsEditDialogOpen(false);
  };

  const handleDeleteProfile = () => {
    if (!selectedProfileId) return;

    deleteProfile(selectedProfileId);
    setIsDeleteDialogOpen(false);
    setSelectedProfileId(null);
  };

  const resetForm = () => {
    setNewProfileName("");
    // Find first unused avatar if possible
    const usedAvatars = profiles.map(p => p.avatar);
    const available = defaultAvatars.find(a => !usedAvatars.includes(a));
    setSelectedAvatar(available || defaultAvatars[0]);
    setIsKids(false);
    setSelectedProfileId(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Filter out used avatars for the Add dialog
  const getAvailableAvatars = (currentAvatar?: string) => {
    const usedAvatars = profiles.map(p => p.avatar);
    return defaultAvatars.map(avatar => ({
      url: avatar,
      isUsed: usedAvatars.includes(avatar) && avatar !== currentAvatar
    }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground mb-8">
        Who's watching?
      </h1>

      {/* Profiles Grid */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-4xl mb-12">
        {/* Existing Profiles */}
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleProfileClick(profile.id)}
            className="group flex flex-col items-center gap-3 focus-ring rounded-lg p-2"
          >
            <div className="relative">
              <img
                src={profile.avatar}
                alt={profile.name}
                className={cn(
                  "w-24 h-24 md:w-32 md:h-32 rounded-md object-cover",
                  "border-2 border-transparent transition-all duration-200",
                  "group-hover:border-foreground group-focus:border-foreground",
                  isManageMode && "opacity-50"
                )}
              />
              {isManageMode && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Pencil className="w-8 h-8 text-foreground" />
                </div>
              )}
              {profile.isKids && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                  KIDS
                </span>
              )}
            </div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm md:text-base">
              {profile.name}
            </span>
          </button>
        ))}

        {/* Add Profile Button */}
        {canAddProfile && (
          <button
            onClick={openAddDialog}
            className="group flex flex-col items-center gap-3 focus-ring rounded-lg p-2"
          >
            <div
              className={cn(
                "w-24 h-24 md:w-32 md:h-32 rounded-md",
                "border-2 border-muted-foreground/50",
                "flex items-center justify-center",
                "group-hover:border-foreground transition-colors"
              )}
            >
              <Plus className="w-12 h-12 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm md:text-base">
              Add Profile
            </span>
          </button>
        )}
      </div>

      {/* Manage Profiles Button */}
      {profiles.length > 0 && (
        <button
          onClick={() => setIsManageMode(!isManageMode)}
          className={cn(
            "px-6 py-2 border border-muted-foreground text-muted-foreground",
            "hover:border-foreground hover:text-foreground transition-colors",
            "text-sm md:text-base tracking-wider",
            isManageMode && "bg-foreground text-background border-foreground hover:bg-foreground/90"
          )}
        >
          {isManageMode ? "DONE" : "MANAGE PROFILES"}
        </button>
      )}

      {/* Add Profile Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Avatar Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Choose Avatar</label>
              <div className="grid grid-cols-5 gap-2">
                {getAvailableAvatars().map((avatarInfo, index) => (
                  <button
                    key={index}
                    onClick={() => !avatarInfo.isUsed && setSelectedAvatar(avatarInfo.url)}
                    disabled={avatarInfo.isUsed}
                    className={cn(
                      "relative rounded-md overflow-hidden aspect-square",
                      "ring-2 ring-offset-2 ring-offset-card transition-all",
                      selectedAvatar === avatarInfo.url
                        ? "ring-primary"
                        : "ring-transparent",
                      !avatarInfo.isUsed && "hover:ring-muted-foreground",
                      avatarInfo.isUsed && "opacity-20 cursor-not-allowed"
                    )}
                  >
                    <img
                      src={avatarInfo.url}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedAvatar === avatarInfo.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Enter profile name"
                maxLength={20}
                className="bg-muted border-border"
              />
            </div>
            {/* Kids feature hidden/ignored as per strict request, or optional? 
                User said "Remove Kids profile option" in previous prompt. 
                I will leave the state but remove the UI checkbox to be safe with the "Old Design" + "User Request" hybrid. 
                Actually, let's keep it simple and hide the checkbox for now since they explicitly asked to remove it.
            */}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProfile}
              disabled={!newProfileName.trim()}
            >
              Add Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Avatar Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Choose Avatar</label>
              <div className="grid grid-cols-5 gap-2">
                {getAvailableAvatars(selectedAvatar).map((avatarInfo, index) => (
                  <button
                    key={index}
                    onClick={() => !avatarInfo.isUsed && setSelectedAvatar(avatarInfo.url)}
                    disabled={avatarInfo.isUsed}
                    className={cn(
                      "relative rounded-md overflow-hidden aspect-square",
                      "ring-2 ring-offset-2 ring-offset-card transition-all",
                      selectedAvatar === avatarInfo.url
                        ? "ring-primary"
                        : "ring-transparent",
                      !avatarInfo.isUsed && "hover:ring-muted-foreground",
                      avatarInfo.isUsed && "opacity-20 cursor-not-allowed"
                    )}
                  >
                    <img
                      src={avatarInfo.url}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedAvatar === avatarInfo.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Enter profile name"
                maxLength={20}
                className="bg-muted border-border"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                setIsEditDialogOpen(false);
                setIsDeleteDialogOpen(true);
              }}
              className="sm:mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={!newProfileName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this profile and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProfile}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
