import { getMyPreferences } from "@/actions/settings";
import { PreferencesForm } from "@/components/settings/preferences-form";

export default async function SettingsPage() {
  const prefs = await getMyPreferences();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-semibold text-transparent">
        Settings
      </h1>
      <PreferencesForm
        initialName={prefs.name ?? ""}
        initialCheckInReminders={prefs.notifyCheckInReminders}
        initialWeeklyDigest={prefs.notifyWeeklyDigest}
      />
    </div>
  );
}
