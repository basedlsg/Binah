import React, { useState } from "react";
import "../styles/plan.css";

export default function PlanForm() {
  const [date, setDate] = useState("2025-08-21");
  const [time, setTime] = useState("18:00");
  const [plans, setPlans] = useState("cocktails and dinner");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log({ date, time, plans });
  }

  return (
    <main className="plan-page">
      <div className="plan-wrap">
        <h1 className="plan-title">Plan</h1>
        <div className="plan-subheads">
          <div className="plan-subtitle">Create a Plan for New York City</div>
          <div className="plan-helper">
            Enter your activities, locations and times below, we’ll create a day plan for you.
          </div>
        </div>

        <form className="plan-form" onSubmit={onSubmit}>
          <section className="card focus-ring">
            <label className="label">Date</label>
            <div className="input-wrap">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
              <span aria-hidden="true" className="icon-right">
                {calendarSvg}
              </span>
            </div>
          </section>

          <section className="card focus-ring">
            <label className="label">Time</label>
            <div className="input-wrap">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input"
              />
              <span aria-hidden="true" className="icon-right">
                {clockSvg}
              </span>
            </div>
          </section>

          <section className="card focus-ring">
            <label className="label">Your Plans</label>
            <textarea
              value={plans}
              onChange={(e) => setPlans(e.target.value)}
              className="textarea"
              rows={6}
              placeholder="e.g., Cocktails and dinner"
            />
          </section>



          <button type="submit" className="primary-btn">Create Plan</button>
        </form>
      </div>
    </main>
  );
}



const calendarSvg: React.ReactNode = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="#94a3b8" strokeWidth="2"/>
    <path d="M8 3v4M16 3v4M3 11h18" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const clockSvg: React.ReactNode = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#94a3b8" strokeWidth="2"/>
    <path d="M12 7v5l4 2" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

