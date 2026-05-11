"use client";
import { useState, useEffect } from "react";
import PrepList from "../Components/prep/PrepList";
import PrepDetail from "../Components/prep/PrepDetail";
import CreateTrackerModal from "../Components/prep/CreateTrackerModal";

export default function PrepPage() {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTrackerId, setActiveTrackerId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [applications, setApplications] = useState([]);

  // Fetch all trackers
  const fetchTrackers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prep");
      const data = await res.json();
      setTrackers(data.trackers ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch applications for the company picker
  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      setApplications(data.applications ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTrackers();
    fetchApplications();
  }, []);

  const activeTracker = trackers.find((t) => t.id === activeTrackerId) ?? null;

  const handleTrackerCreated = (tracker) => {
    setTrackers((prev) => [tracker, ...prev]);
    setActiveTrackerId(tracker.id);
    setShowCreate(false);
  };

  const handleTrackerDeleted = (id) => {
    setTrackers((prev) => prev.filter((t) => t.id !== id));
    if (activeTrackerId === id) setActiveTrackerId(null);
  };

  const handleTrackerUpdated = (updated) => {
    setTrackers((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  return (
    <div className="prep-page">
      {/* Left panel — tracker list */}
      <div className="prep-sidebar">
        <div className="prep-sidebar-header">
          <div>
            <div className="page-title">Prep Tracker</div>
            <div className="page-subtitle">
              {trackers.length} active tracker{trackers.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowCreate(true)}
          >
            <span>+</span> New
          </button>
        </div>

        <PrepList
          trackers={trackers}
          loading={loading}
          activeId={activeTrackerId}
          onSelect={setActiveTrackerId}
        />
      </div>

      {/* Right panel — detail / empty state */}
      <div className="prep-main">
        {activeTracker ? (
          <PrepDetail
            key={activeTracker.id}
            tracker={activeTracker}
            onDelete={handleTrackerDeleted}
            onUpdate={handleTrackerUpdated}
          />
        ) : (
          <div className="empty-state" style={{ marginTop: 80 }}>
            <div className="empty-state-icon">📋</div>
            <h3>Select a tracker</h3>
            <p>Pick one from the left or create a new one</p>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTrackerModal
          applications={applications}
          onClose={() => setShowCreate(false)}
          onCreated={handleTrackerCreated}
        />
      )}

      <style>{`
        .prep-page {
          display: flex;
          gap: 0;
          height: calc(100vh - 56px);
          overflow: hidden;
        }
        .prep-sidebar {
          width: 300px;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .prep-sidebar-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--border);
          gap: 12px;
        }
        .prep-main {
          flex: 1;
          overflow-y: auto;
          padding: 24px 28px;
        }
        @media (max-width: 768px) {
          .prep-page {
            flex-direction: column;
            height: auto;
          }
          .prep-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .prep-main {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}

