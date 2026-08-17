"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Loader2, XCircle, Mail } from "lucide-react";
import {
  getMyDonorProfile,
  updateMyDonorProfile,
  updateDonorProfilePhoto,
  isDonorProfileError,
  type DonorProfile,
} from "@/lib/donorProfile";

const ACCESS_TOKEN_KEY = "access_token";

function Field({
  id, label, value, onChange, disabled, type = "text", placeholder, readOnly, title: fieldTitle,
}: {
  id: string; label: string; value: string; onChange?: (v: string) => void; disabled: boolean;
  type?: string; placeholder?: string; readOnly?: boolean; title?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-[#1A534A] mb-1.5 uppercase tracking-wide">
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
            ? "border-black/15 bg-white text-[#5B7571] cursor-not-allowed shadow-inner"
            : "border-[#1A534A]/40 bg-white text-[#1A534A] shadow-sm focus:ring-2 focus:ring-[#1A534A]/30 focus:border-[#1A534A]"
          }
          placeholder:text-[#9FB0AC]`}
      />
    </div>
  );
}

export function DonorProfileCard() {
  const { t, i18n } = useTranslation(["donor", "common"]);
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function load() {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        setError(t("errors.sessionExpiredGeneric"));
        setIsLoading(false);
        return;
      }
      const result = await getMyDonorProfile(accessToken);
      setIsLoading(false);
      if (isDonorProfileError(result)) {
        setError(result.message);
        return;
      }
      applyProfile(result.profile);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyProfile(p: DonorProfile) {
    setProfile(p);
    setFullName(p.fullName);
    setCompany(p.company ?? "");
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
      setError(t("errors.sessionExpiredGeneric"));
      return;
    }
    setIsSaving(true);
    const result = await updateMyDonorProfile(accessToken, { fullName, company });
    setIsSaving(false);
    if (isDonorProfileError(result)) {
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
      setError(t("errors.sessionExpiredGeneric"));
      return;
    }
    setIsUploadingPhoto(true);
    const result = await updateDonorProfilePhoto(accessToken, file);
    setIsUploadingPhoto(false);
    if (isDonorProfileError(result)) {
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
        <p role="alert" className="text-sm text-red-600">
          {error ?? t("profile.errors.couldNotLoad")}
        </p>
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt);
  const memberSinceLabel = Number.isNaN(memberSince.getTime())
    ? ""
    : t("profile.memberSince", {
        date: memberSince.toLocaleDateString(i18n.language, { month: "short", year: "numeric" }),
      });

  const createdOnLabel = Number.isNaN(memberSince.getTime())
    ? t("profile.accountAccess.notSet")
    : memberSince.toLocaleDateString(i18n.language, { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      {error && (
        <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Identity card */}
      <div className="bg-[#eaf5f0] rounded-2xl border border-black/10 p-8 shadow-sm flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-[#CCEAE8] overflow-hidden flex items-center justify-center">
            {profile.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profilePhotoUrl} alt={profile.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-[#1A534A]">
                {profile.fullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1A534A] text-white flex items-center justify-center shadow-sm hover:bg-[#134038] transition-colors disabled:opacity-60"
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
            <h1 className="text-lg font-semibold text-[#1A534A] truncate">{profile.fullName}</h1>
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide bg-[#F4C542] text-[#4a3b00] px-2 py-0.5 rounded">
              {t("profile.badge")}
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-[#7C9791] mt-1 truncate">
            <Mail className="w-3 h-3 flex-shrink-0" />
            {profile.email}
          </p>
          {profile.company && <p className="text-xs text-[#7C9791] mt-0.5">{profile.company}</p>}
          {memberSinceLabel && <p className="text-xs text-[#7C9791] mt-0.5">{memberSinceLabel}</p>}
        </div>
      </div>

      {/* Editable fields card */}
      <div className="bg-[#eaf5f0] rounded-2xl border border-black/10 p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <Field id="full-name" label={t("profile.fields.fullName")} value={fullName} onChange={setFullName} disabled={!isEditing} />
          <Field
            id="donor-email"
            label={t("profile.fields.email")}
            type="email"
            value={profile.email}
            disabled
            readOnly
            title={t("profile.fields.emailReadOnly")}
          />
          <div className="col-span-2">
            <Field
              id="company"
              label={t("profile.fields.company")}
              value={company}
              onChange={setCompany}
              disabled={!isEditing}
              placeholder={t("profile.fields.companyPlaceholder")}
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
                {isSaving ? t("common:buttons.saving") : t("common:buttons.save")}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                className="text-sm font-semibold text-[#5B7571] hover:text-[#1A534A] px-5 py-2.5 disabled:opacity-50"
              >
                {t("common:buttons.cancel")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="bg-[#1A534A] hover:bg-[#134038] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm"
            >
              {t("common:buttons.edit")}
            </button>
          )}
        </div>
      </div>

      {/* Account Access summary */}
      <div className="bg-[#eaf5f0] rounded-2xl border border-black/10 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1A534A] mb-1">{t("profile.accountAccess.title")}</h2>
        <p className="text-sm text-[#5B7571] mb-4">{t("profile.accountAccess.description")}</p>
        <div className="divide-y divide-black/5">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-[#5B7571]">{t("profile.accountAccess.company")}</span>
            <span className="text-sm font-semibold text-[#1A534A]">{profile.company ?? t("profile.accountAccess.notSet")}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-[#5B7571]">{t("profile.accountAccess.accountStatus")}</span>
            <span
              className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                profile.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              }`}
            >
              {profile.isActive ? t("profile.accountAccess.active") : t("profile.accountAccess.inactive")}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-[#5B7571]">{t("profile.accountAccess.createdOn")}</span>
            <span className="text-sm font-semibold text-[#1A534A]">{createdOnLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
