"use client";

import { useState } from "react";
import { useApplications } from "../../context/ApplicationsContext";
import ApplicationsTable from "../../Components/applications/ApplicationsTab";
import AddJobModal from "../../Components/applications/AddJobModal";
import ApplicationsSkeleton from "./Applicationsskeleton";

export default function ApplicationsPage() {
  const { applications, addApplication, updateApplication, deleteApplication, loading } =
    useApplications();
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">
            {applications.length} total application
            {applications.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingJob(null);
            setShowModal(true);
          }}
        >
          <span>+</span> Add Application
        </button>
      </div>

      {loading ? (
        <ApplicationsSkeleton />
      ) : (
        <ApplicationsTable
          applications={applications}
          onUpdate={updateApplication}
          onDelete={deleteApplication}
          onEdit={(job) => {
            setEditingJob(job);
            setShowModal(true);
          }}
        />
      )}

      {showModal && (
        <AddJobModal
          onClose={() => {
            setShowModal(false);
            setEditingJob(null);
          }}
          onSave={(job) => {
            editingJob
              ? updateApplication(editingJob.id, job)
              : addApplication(job);
            setShowModal(false);
            setEditingJob(null);
          }}
          initialData={editingJob}
        />
      )}
    </>
  );
}