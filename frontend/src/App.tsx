import { NavLink, Route, Routes } from "react-router-dom";

import Advisor from "./pages/Advisor";
import Budget from "./pages/Budget";
import Dashboard from "./pages/Dashboard";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive ? "bg-brand-500 text-white" : "bg-white text-slate-700"
  }`;

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-brand-900">CardSmart</h1>
          <nav className="flex gap-2 rounded-full bg-slate-100 p-1">
            <NavLink className={navClass} to="/">Advisor</NavLink>
            <NavLink className={navClass} to="/budget">Budget</NavLink>
            <NavLink className={navClass} to="/dashboard">Dashboard</NavLink>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Advisor />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}
