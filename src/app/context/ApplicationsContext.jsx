"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

const Ctx = createContext(null);

export function ApplicationsProvider({ children }) {
  const { user, isLoaded } = useUser();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch from DB when user is ready
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setApplications([]);
      setLoading(false);
      return;
    }

    fetch("/api/applications")
      .then((r) => r.json())
      .then(({ applications }) => {
        setApplications(applications || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, isLoaded]);

  const addApplication = async (job) => {
    const newJob = {
      ...job,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      statusHistory: [{ status: job.status, date: new Date().toISOString() }],
    };

    // Optimistic update
    setApplications((prev) => [newJob, ...prev]);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });
      const { application } = await res.json();
      // Replace optimistic entry with server response
      setApplications((prev) =>
        prev.map((a) => (a.id === newJob.id ? application : a)),
      );
    } catch (err) {
      console.error("Failed to save application:", err);
      // Rollback on failure
      setApplications((prev) => prev.filter((a) => a.id !== newJob.id));
    }
  };

  const updateApplication = async (id, updates) => {
    // Optimistic update
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== id) return app;
        const statusChanged = updates.status && updates.status !== app.status;
        return {
          ...app,
          ...updates,
          statusHistory: statusChanged
            ? [
                ...(app.statusHistory || []),
                { status: updates.status, date: new Date().toISOString() },
              ]
            : app.statusHistory,
        };
      }),
    );

    try {
      await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Failed to update application:", err);
    }
  };

  const deleteApplication = async (id) => {
    // Optimistic update
    setApplications((prev) => prev.filter((a) => a.id !== id));

    try {
      await fetch(`/api/applications/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete application:", err);
    }
  };

  return (
    <Ctx.Provider
      value={{
        applications,
        loading,
        addApplication,
        updateApplication,
        deleteApplication,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useApplications = () => useContext(Ctx);
