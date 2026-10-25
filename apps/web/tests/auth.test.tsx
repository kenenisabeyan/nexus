import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "../src/AuthContext.js";
import Login from "../src/pages/Login.js";
import Register from "../src/pages/Register.js";

// The API module is mocked deliberately — these are component tests,
// verifying UI behavior (form handling, loading states, error display,
// navigation), not a second copy of the real HTTP/Postgres tests that
// already exist and pass in apps/api/tests/auth.test.ts.
vi.mock("../src/api.js", () => ({
  api: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

import { api } from "../src/api.js";

function renderWithProviders(ui: React.ReactElement, initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<div>Briefing page placeholder</div>} />
          <Route path="/*" element={ui} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks for an existing session on mount via GET /api/auth/me", async () => {
    (api.me as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 1, email: "existing@nexus.dev", created_at: "2026-01-01" } });

    function Probe() {
      const { user, loading } = useAuth();
      if (loading) return <div>loading</div>;
      return <div>{user ? `logged in as ${user.email}` : "anonymous"}</div>;
    }

    render(
      <MemoryRouter>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("loading")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("logged in as existing@nexus.dev")).toBeInTheDocument());
    expect(api.me).toHaveBeenCalledTimes(1);
  });

  it("treats a failed /api/auth/me (no session) as anonymous, not an error", async () => {
    (api.me as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("401"));

    function Probe() {
      const { user, loading } = useAuth();
      if (loading) return <div>loading</div>;
      return <div>{user ? "logged in" : "anonymous"}</div>;
    }

    render(
      <MemoryRouter>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("anonymous")).toBeInTheDocument());
  });
});

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.me as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("401"));
  });

  it("submits the form and calls api.login with the entered credentials", async () => {
    (api.login as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 1, email: "alice@nexus.dev", created_at: "2026-01-01" } });
    const user = userEvent.setup();

    renderWithProviders(<Login />, ["/login"]);

    await user.type(screen.getByLabelText("Email"), "alice@nexus.dev");
    await user.type(screen.getByLabelText("Password"), "correcthorsebattery");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(api.login).toHaveBeenCalledWith("alice@nexus.dev", "correcthorsebattery"));
  });

  it("navigates to the briefing page after a successful login", async () => {
    (api.login as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 1, email: "alice@nexus.dev", created_at: "2026-01-01" } });
    const user = userEvent.setup();

    renderWithProviders(<Login />, ["/login"]);
    await user.type(screen.getByLabelText("Email"), "alice@nexus.dev");
    await user.type(screen.getByLabelText("Password"), "correcthorsebattery");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText("Briefing page placeholder")).toBeInTheDocument());
  });

  it("displays the backend's real error message on failed login, without crashing", async () => {
    (api.login as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Invalid email or password"));
    const user = userEvent.setup();

    renderWithProviders(<Login />, ["/login"]);
    await user.type(screen.getByLabelText("Email"), "alice@nexus.dev");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText("Invalid email or password")).toBeInTheDocument());
    expect(screen.queryByText("Briefing page placeholder")).not.toBeInTheDocument();
  });

  it("disables the submit button while the request is in flight", async () => {
    let resolveLogin!: (value: unknown) => void;
    (api.login as ReturnType<typeof vi.fn>).mockReturnValue(new Promise((resolve) => (resolveLogin = resolve)));
    const user = userEvent.setup();

    renderWithProviders(<Login />, ["/login"]);
    await user.type(screen.getByLabelText("Email"), "alice@nexus.dev");
    await user.type(screen.getByLabelText("Password"), "correcthorsebattery");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    resolveLogin({ user: { id: 1, email: "alice@nexus.dev", created_at: "2026-01-01" } });
    await waitFor(() => expect(screen.getByText("Briefing page placeholder")).toBeInTheDocument());
  });
});

describe("Register page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.me as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("401"));
  });

  it("registers, then logs in automatically (register() calls both, matching AuthContext's documented behavior)", async () => {
    (api.register as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 2, email: "bob@nexus.dev", created_at: "2026-01-01" } });
    (api.login as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 2, email: "bob@nexus.dev", created_at: "2026-01-01" } });
    const user = userEvent.setup();

    renderWithProviders(<Register />, ["/register"]);
    await user.type(screen.getByLabelText("Email"), "bob@nexus.dev");
    await user.type(screen.getByLabelText("Password"), "correcthorsebattery");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(api.register).toHaveBeenCalledWith("bob@nexus.dev", "correcthorsebattery");
      expect(api.login).toHaveBeenCalledWith("bob@nexus.dev", "correcthorsebattery");
    });
    await waitFor(() => expect(screen.getByText("Briefing page placeholder")).toBeInTheDocument());
  });

  it("shows the backend's real validation error (e.g. duplicate email) without navigating away", async () => {
    (api.register as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("An account with this email already exists"));
    const user = userEvent.setup();

    renderWithProviders(<Register />, ["/register"]);
    await user.type(screen.getByLabelText("Email"), "dup@nexus.dev");
    await user.type(screen.getByLabelText("Password"), "correcthorsebattery");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(screen.getByText("An account with this email already exists")).toBeInTheDocument());
    expect(screen.queryByText("Briefing page placeholder")).not.toBeInTheDocument();
  });
});
