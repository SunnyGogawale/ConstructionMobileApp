import { useState } from "react";
import { Bell, Building2, Check, ShieldCheck, Users } from "lucide-react";
import { PageHeading } from "../../components/PageHeading.jsx";
export function SettingsPage({
  settings,
  onSave,
  notify
}) {
  const profile = settings["workspace.profile"] || {};
  const [values, setValues] = useState(() => ({
    companyName: profile.companyName ?? settings["workspace.companyName"] ?? "",
    primaryContact: profile.primaryContact ?? settings["workspace.primaryContact"] ?? "",
    businessEmail: profile.businessEmail ?? settings["workspace.businessEmail"] ?? "",
    attendanceRadius: profile.attendanceRadius ?? settings["workspace.attendanceRadius"] ?? ""
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async event => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({
        "workspace.profile": {
          companyName: values.companyName,
          primaryContact: values.primaryContact,
          businessEmail: values.businessEmail,
          attendanceRadius: values.attendanceRadius ? Number(values.attendanceRadius) : ""
        }
      });
      notify("Workspace settings saved.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };
  return <>
      <PageHeading title="Settings & access" description="Manage workspace identity, role boundaries, and notification preferences." action={<button className="button button-primary" type="submit" form="workspace-settings" disabled={saving}>
            <Check size={16} />{saving ? "Saving…" : "Save changes"}
          </button>} />
      <div className="settings-layout">
        <div className="panel settings-nav">
          <button className="settings-active">
            <Building2 size={17} />
            Workspace profile
          </button>
          <button>
            <ShieldCheck size={17} />
            Roles & permissions
          </button>
          <button>
            <Bell size={17} />
            Notifications
          </button>
          <button>
            <Users size={17} />
            Team access
          </button>
        </div>
        <form className="panel settings-form" id="workspace-settings" onSubmit={save}>
          <h2>Workspace profile</h2>
          <p>
            Company details used across project records and client documents.
          </p>
          <label>
            Company name
            <input value={values.companyName} onChange={event => setValues(current => ({
            ...current,
            companyName: event.target.value
          }))} />
          </label>
          <div className="settings-form-row">
            <label>
              Primary contact
              <input value={values.primaryContact} onChange={event => setValues(current => ({
              ...current,
              primaryContact: event.target.value
            }))} />
            </label>
            <label>
              Business email
              <input type="email" value={values.businessEmail} onChange={event => setValues(current => ({
              ...current,
              businessEmail: event.target.value
            }))} />
            </label>
          </div>
          <label>
            Default attendance radius
            <div className="input-suffix">
              <input type="number" min="1" max="1000" value={values.attendanceRadius} onChange={event => setValues(current => ({
              ...current,
              attendanceRadius: event.target.value
            }))} />
              <span>metres</span>
            </div>
          </label>
          <div className="settings-note">
            <ShieldCheck size={17} />
            <span>
              GPS attendance and break limits are verified by the server, not
              these display preferences.
            </span>
          </div>
          {error && <div className="data-error" role="alert">{error}</div>}
        </form>
      </div>
    </>;
}
