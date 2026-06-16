import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const highlights = [
  {
    title: "Workout plans",
    text: "Pick a routine, follow the timer, and stay in rhythm.",
  },
  {
    title: "Hydration tracking",
    text: "Confirm detected liquid intake before water is stored.",
  },
  {
    title: "Native reminders",
    text: "Alerts are handled by the device on Android and iPhone.",
  },
];

const stats = [
  { label: "Workouts", value: "6 types" },
  { label: "Hydration", value: "Confirm" },
  { label: "Reminders", value: "Device" },
  { label: "Progress", value: "Live" },
];

const phoneTiles = [
  { label: "Today", value: "Balanced plan active", tone: "accent" },
  { label: "Water", value: "Goal tracking on", tone: "blue" },
  { label: "Workout", value: "One-minute guides", tone: "green" },
  { label: "Meals", value: "Meal timing ready", tone: "amber" },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const logoSrc = "/kenntyfit-logo.png";

  return (
    <div className="welcome-page">
      <div className="welcome-shell">
        <section className="welcome-copy">
          <div className="welcome-brand">
            <img className="welcome-brand__icon" src={logoSrc} alt="KenntyFit logo" />
            <div>
              <div className="welcome-brand__eyebrow">KenntyFit</div>
              <div className="welcome-brand__name">KenntyFit</div>
            </div>
          </div>

          <h1 className="welcome-title">Your workout, water, and meal tracker in one app.</h1>
          <p className="welcome-subtitle">
            Start with a clean mobile experience, then move into login or signup when you are ready.
          </p>

          <div className="welcome-actions">
            {user ? (
              <button className="btn btn-primary welcome-actions__primary" onClick={() => navigate("/dashboard")}>
                Open Dashboard
              </button>
            ) : (
              <button className="btn btn-primary welcome-actions__primary" onClick={() => navigate("/login")}>
                Sign In
              </button>
            )}
            <button className="btn btn-ghost welcome-actions__secondary" onClick={() => navigate("/login?mode=register")}>
              Create Account
            </button>
          </div>

          <div className="welcome-stats" aria-label="App highlights">
            {stats.map((stat) => (
              <div key={stat.label} className="welcome-stat">
                <div className="welcome-stat__label">{stat.label}</div>
                <div className="welcome-stat__value">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="welcome-highlights">
            {highlights.map((item) => (
              <div key={item.title} className="welcome-highlight">
                <div className="welcome-highlight__title">{item.title}</div>
                <div className="welcome-highlight__text">{item.text}</div>
              </div>
            ))}
          </div>
        </section>

        <aside className="welcome-phone" aria-label="App preview">
          <div className="welcome-phone__status">
            <span>9:41</span>
            <span>● ● ●</span>
          </div>

          <div className="welcome-phone__hero">
            <div className="welcome-phone__eyebrow">Today</div>
            <div className="welcome-phone__title">Keep the pace steady.</div>
            <div className="welcome-phone__text">Workout, hydration, and meals stay aligned on the device.</div>
          </div>

          <div className="welcome-phone__tiles">
            {phoneTiles.map((tile) => (
              <div key={tile.label} className={`welcome-phone__tile welcome-phone__tile--${tile.tone}`}>
                <div className="welcome-phone__tile-label">{tile.label}</div>
                <div className="welcome-phone__tile-value">{tile.value}</div>
              </div>
            ))}
          </div>

          <div className="welcome-phone__panel">
            <div className="welcome-phone__panel-title">Next actions</div>
            <div className="welcome-phone__row">
              <span>Workout</span>
              <strong>Cardio</strong>
            </div>
            <div className="welcome-phone__row">
              <span>Water</span>
              <strong>Confirm first</strong>
            </div>
            <div className="welcome-phone__row">
              <span>Meals</span>
              <strong>On schedule</strong>
            </div>
          </div>

          <div className="welcome-phone__nav">
            <span className="active">Home</span>
            <span>Workouts</span>
            <span>Water</span>
            <span>Progress</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
