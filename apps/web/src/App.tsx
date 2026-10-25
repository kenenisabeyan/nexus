import { NavLink, Route, Routes } from "react-router-dom";
import Briefing from "./pages/Briefing.js";
import ItemDetail from "./pages/ItemDetail.js";
import Search from "./pages/Search.js";
import Sources from "./pages/Sources.js";
import Explorer from "./pages/Explorer.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import { ReviewQueue } from "./pages/ReviewQueue.js";
import { useAuth } from "./AuthContext.js";

function AccountWidget() {
  const { user, loading, logout } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <div className="rail-account">
        <NavLink to="/login" className="rail-link">Sign in</NavLink>
        <NavLink to="/register" className="rail-link">Create account</NavLink>
      </div>
    );
  }

  return (
    <div className="rail-account">
      <span className="rail-account-email">{user.email}</span>
      <span className="rail-account-role">[{user.role || "user"}]</span>
      <button className="rail-account-action" onClick={() => logout()}>
        Sign out
      </button>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  const isReviewer = user?.role === "reviewer" || user?.role === "admin";

  return (
    <div className="shell">
      <aside className="rail">
        <div className="rail-brand">
          <div className="rail-mark" />
          <span className="rail-brand-text">Nexus</span>
        </div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => "rail-link" + (isActive ? " active" : "")}>
            Daily Briefing
          </NavLink>
          <NavLink to="/explorer" className={({ isActive }) => "rail-link" + (isActive ? " active" : "")}>
            Knowledge Explorer
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => "rail-link" + (isActive ? " active" : "")}>
            Search
          </NavLink>
          <NavLink to="/sources" className={({ isActive }) => "rail-link" + (isActive ? " active" : "")}>
            Source Registry
          </NavLink>
          {isReviewer && (
            <NavLink to="/review" className={({ isActive }) => "rail-link" + (isActive ? " active" : "")}>
              Review Queue
            </NavLink>
          )}
        </nav>
        <AccountWidget />
        <div className="rail-footer">
          Nexus Platform — Production-ready build with role authorization, human review queue, and OpenClaw plugin integration.
        </div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Briefing />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/search" element={<Search />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/review" element={<ReviewQueue />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  );
}

