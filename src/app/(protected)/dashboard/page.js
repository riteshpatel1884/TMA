"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApplications } from "../../context/ApplicationsContext";
import Dashboard from "../../Components/Dashboard";
import AddJobModal from "../../Components/AddJobModal";
import DashboardSkeleton from "./Dashboardskeleton";

export default function DashboardPage() {
  const { applications, addApplication, updateApplication, loading } = useApplications();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {applications.length} total application
            {applications.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <span>+</span> Add Application
        </button>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <Dashboard
          applications={applications}
          onAddClick={() => setShowModal(true)}
          onUpdateStatus={updateApplication}
          setActiveTab={(tab) => router.push(`/${tab}`)}
        />
      )}

      {showModal && (
        <AddJobModal
          onClose={() => setShowModal(false)}
          onSave={(job) => {
            addApplication(job);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}