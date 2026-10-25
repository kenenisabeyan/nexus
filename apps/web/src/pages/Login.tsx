import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.js";

export default function Login() {
  const { login } = useAuth();
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
      await login(email, password);
      navigate("/");
    } catch (err) {
      // Mirrors the backend's deliberate choice (see auth.service.ts) to
      // give an identical error for "no such account" and "wrong password,"
      // so the UI does not leak which emails are registered.
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <p className="page-eyebrow">Welcome back</p>
      <h1 className="page-title">Sign in</h1>
      <p className="page-sub">Sign in to configure your professional context and receive a personalized briefing.</p>

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
        />
        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
    </>
  );
}
