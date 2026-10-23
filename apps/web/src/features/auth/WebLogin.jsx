import { useState } from "react";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { completePasswordReset } from "../../shared/api.js";
export function WebLogin({
  error,
  onLogin,
  onRegister
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("resetToken") || "");
  const [forgot, setForgot] = useState(false);
  const [signUp, setSignUp] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setRegistrationError("");
    setRegistrationSuccess("");
    try {
      if (resetToken) {
        if (password.length < 6) throw new Error("Use a password with at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        const result = await completePasswordReset(resetToken, password);
        setRegistrationSuccess(result.message);
        setResetToken("");
        setPassword("");
        setConfirmPassword("");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (signUp) {
        if (password.length < 6) throw new Error("Use a password with at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        const result = await onRegister(name.trim(), email.trim(), password);
        setRegistrationSuccess(result.message || "Your account was created. You can now sign in to the mobile app.");
        setSignUp(false);
        setPassword("");
        setConfirmPassword("");
      } else if (!forgot) {
        await onLogin(email.trim(), password);
      } else {
        setRegistrationSuccess("Password reset is not configured yet. Contact your administrator for help.");
      }
    } catch (submitError) {
      if (signUp || resetToken) setRegistrationError(submitError.message);else if (forgot) setRegistrationError("Password reset is not available yet. Contact your administrator.");
    } finally {
      setBusy(false);
    }
  };
  const switchMode = () => {
    setSignUp(value => !value);
    setForgot(false);
    setRegistrationError("");
    setRegistrationSuccess("");
    setConfirmPassword("");
  };
  return <main className="login-screen">
      <div className="login-photo" role="img" aria-label="Modern construction site" />
      <section className="login-panel">
        <div className="login-brand"><span className="brand-mark"><Building2 size={21} /></span><span><strong>BuildFlow</strong><small>CONSTRUCTION OPERATIONS</small></span></div>
        <div className="login-form-wrap">
          <span className="eyebrow">SECURE WORKSPACE</span>
          <h1>{resetToken ? "Choose a new password" : signUp ? "Create your account" : forgot ? "Reset your password" : "Welcome back"}</h1>
          <p>{resetToken ? "Set a new password for your BuildFlow account." : signUp ? "Register a worker account to access BuildFlow field operations." : forgot ? "Enter your work email to request a password reset." : "Sign in to manage projects, crews, and site operations."}</p>
          <form onSubmit={submit}>
            {signUp && <label>Full name<input required autoComplete="name" minLength={2} maxLength={120} value={name} onChange={event => setName(event.target.value)} placeholder="Your name" /></label>}
            {!resetToken && <label>Work email<input required autoComplete="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@company.com" /></label>}
            {!forgot && <label>Password<input required autoComplete={signUp || resetToken ? "new-password" : "current-password"} minLength={signUp || resetToken ? 6 : undefined} maxLength={200} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={signUp || resetToken ? "At least 6 characters" : "Enter your password"} /></label>}
            {(signUp || resetToken) && <label>Confirm password<input required autoComplete="new-password" minLength={6} maxLength={200} type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Enter your password again" /></label>}
            {!signUp && !resetToken && error && <div className="login-error">{error}</div>}
            {registrationError && <div className="login-error" role="alert">{registrationError}</div>}
            {registrationSuccess && <div className="login-notice" role="status">{registrationSuccess}</div>}
            {signUp && <div className="login-notice">Self-registration creates a worker account. Administrator and project-manager access is assigned by an administrator.</div>}
            {forgot && !resetToken && <div className="login-notice">Password reset delivery must be configured by your administrator.</div>}
            <button className="button button-primary login-submit" type="submit" disabled={busy}>{busy ? resetToken ? "Updating password…" : signUp ? "Creating account…" : "Signing in…" : resetToken ? "Set new password" : signUp ? "Create account" : forgot ? "Continue" : "Sign in"}<ArrowRight size={16} /></button>
          </form>
          {!resetToken && !signUp && !forgot && <button className="login-link" onClick={() => setForgot(true)}>Forgot password?</button>}
          {forgot && !resetToken && <button className="login-link" onClick={() => setForgot(false)}>Back to sign in</button>}
          <div className="login-signup-prompt">
            {!resetToken && <><span>{signUp ? "Already have an account?" : "New to BuildFlow?"}</span>
            <button className="login-link" type="button" onClick={switchMode}>{signUp ? "Sign in" : "Create account"}</button></>}
          </div>
        </div>
        <div className="login-footer"><ShieldCheck size={15} />Authorized access for BuildFlow team members</div>
      </section>
    </main>;
}
