import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    // super-simple demo auth; replace with your real backend later
    if (email.trim() && pass === "admin123") {
      localStorage.setItem("adminAuthed", "1");
      nav("/admin", { replace: true });
    } else {
      setErr("Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-950 text-teal-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/70 p-6">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-gradient-to-br from-teal-400 to-amber-300" />
          <h1 className="text-2xl font-bold">Admin Sign In</h1>
          <p className="text-sm text-teal-200/70">Scan and manage check-ins</p>
        </div>
        {err && <div className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
        <form className="space-y-3" onSubmit={onSubmit}>
          <input
            className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-600"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-600"
            placeholder="Password"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-amber-300 px-4 py-2 font-semibold text-gray-900 hover:bg-amber-200"
          >
            Sign in
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-teal-200/70 hover:text-amber-300">← Back to site</Link>
        </div>
      </div>
    </div>
  );
}
