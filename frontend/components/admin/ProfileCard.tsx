"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, XCircle, Mail } from "lucide-react";
import {
  getMyProfile,
  updateMyProfile,
  updateProfilePhoto,
  isProfileError,
  type StaffProfile,
} from "@/lib/profile";

const ACCESS_TOKEN_KEY = "access_token";

function formatStaffSince(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return `Staff since ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

function Field({
  id,
  label,
  value,
  onChange,
  disabled,
  type = "text",
  placeholder,
  readOnly,
  title: fieldTitle,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled: boolean;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  title?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-[#1A534A] dark:text-[#7dd3c0] mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        title={fieldTitle}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none
          ${disabled || readOnly
            ? "border-black/15 dark:border-white/10 bg-white dark:bg-[#1e3532] text-[#5B7571] dark:text-[#8fada9] cursor-not-allowed shadow-inner"
            : "border-[#1A534A]/40 dark:border-[#7dd3c0]/30 bg-white dark:bg-[#1e3532] text-[#1A534A] dark:text-[#e2f4f0] shadow-sm focus:ring-2 focus:ring-[#1A534A]/30 dark:focus:ring-[#7dd3c0]/20 focus:border-[#1A534A] dark:focus:border-[#7dd3c0]"
          }
          placeholder:text-[#9FB0AC] dark:placeholder:text-[#5a9e94]`}
      />
    </div>
  );
}

export function ProfileCard() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function load() {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        setError("Your session has expired. Please log in again.");
        setIsLoading(false);
        return;
      }
      const result = await getMyProfile(accessToken);
      setIsLoading(false);
      if (isProfileError(result)) {
        setError(result.message);
        return;
      }
      applyProfile(result.profile);
    }
    load();
  }, []);

  function applyProfile(p: StaffProfile) {
    setProfile(p);
    setFullName(p.fullName);
    setTitle(p.department ?? "");
    setLocation(p.location ?? "");
    setPhone(p.phone ?? "");
  }

  function startEditing() {
    setError(undefined);
    setIsEditing(true);
  }

  function cancelEditing() {
    if (profile) applyProfile(profile);
    setIsEditing(false);
    setError(undefined);
  }

  async function handleSave() {
    setError(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }
    setIsSaving(true);
    const result = await updateMyProfile(accessToken, {
      fullName,
      department: title,
      location,
      phone,
    });
    setIsSaving(false);
    if (isProfileError(result)) {
      setError(result.message);
      return;
    }
    applyProfile(result.profile);
    setIsEditing(false);
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setError(undefined);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }
    setIsUploadingPhoto(true);
    const result = await updateProfilePhoto(accessToken, file);
    setIsUploadingPhoto(false);
    if (isProfileError(result)) {
      setError(result.message);
      return;
    }
    applyProfile(result.profile);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#7C9791]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error ?? "Could not load your profile."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-lg px-4 py-3"
        >
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Identity card */}
      <div className="bg-[#eaf5f0] dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 p-8 shadow-sm flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-[#CCEAE8] dark:bg-[#2a6b5e] overflow-hidden flex items-center justify-center">
            {profile.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profilePhotoUrl} alt={profile.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-[#1A534A] dark:text-[#7dd3c0]">
                {profile.fullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1A534A] dark:bg-[#2a6b5e] text-white flex items-center justify-center shadow-sm hover:bg-[#134038] transition-colors disabled:opacity-60"
          >
            {isUploadingPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoSelected}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[#1A534A] dark:text-[#7dd3c0] truncate">{profile.fullName}</h1>
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide bg-[#F4C542] text-[#4a3b00] px-2 py-0.5 rounded">
              {profile.role}
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-[#7C9791] dark:text-[#5a9e94] mt-1 truncate">
            <Mail className="w-3 h-3 flex-shrink-0" />
            {profile.email}
          </p>
          <p className="text-xs text-[#7C9791] dark:text-[#5a9e94] mt-0.5">{formatStaffSince(profile.createdAt)}</p>
        </div>
      </div>

      {/* Editable fields card */}
      <div className="bg-[#eaf5f0] dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="full-name"
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            disabled={!isEditing}
          />
          <Field
            id="staff-email"
            label="Staff Email"
            type="email"
            value={profile.email}
            disabled
            readOnly
            title="Email cannot be changed"
          />
          <Field
            id="title"
            label="Title"
            value={title}
            onChange={setTitle}
            disabled={!isEditing}
            placeholder="e.g. MEL Lead"
          />
          <Field
            id="location"
            label="Location"
            value={location}
            onChange={setLocation}
            disabled={!isEditing}
            placeholder="e.g. Nairobi, Kenya"
          />
          <div className="col-span-2">
            <Field
              id="phone"
              label="Phone"
              type="tel"
              value={phone}
              onChange={setPhone}
              disabled={!isEditing}
              placeholder="e.g. +256700000000"
            />
          </div>
        </div>

        <div className="mt-5">
          {isEditing ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 bg-[#1A534A] hover:bg-[#134038] disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                className="text-sm font-semibold text-[#5B7571] dark:text-[#8fada9] hover:text-[#1A534A] dark:hover:text-[#7dd3c0] px-5 py-2.5 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="bg-[#1A534A] hover:bg-[#134038] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
