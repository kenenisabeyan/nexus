import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.js";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password);
      navigate("/");
    } catch (err) {
      // Surfaces the backend's real validation messages directly (e.g.
      // "Password must be at least 8 characters", "An account with this
      // email already exists") rather than a generic client-side re-check,
      // so there is exactly one source of truth for these rules.
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <p className="page-eyebrow">Get started</p>
      <h1 className="page-title">Create your account</h1>
      <p className="page-sub">Nexus uses your account to build your Professional Context Intelligence profile over time.</p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={onSubmit} className="auth-form">
        <label className="auth-label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="search-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <label className="auth-label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          className="search-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <p className="auth-hint">At least 8 characters.</p>
        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </>
  );
}
