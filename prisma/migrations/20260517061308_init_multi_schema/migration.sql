-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "job_type" TEXT NOT NULL DEFAULT 'Job',
    "apply_type" TEXT NOT NULL DEFAULT 'Direct Apply',
    "platform" TEXT,
    "job_link" TEXT,
    "date_applied" DATE,
    "status" TEXT NOT NULL DEFAULT 'Applied',
    "work_type" TEXT NOT NULL DEFAULT 'Onsite',
    "follow_up_date" DATE,
    "salary" TEXT,
    "resume_version" TEXT,
    "notes" TEXT,
    "rejection_reason" TEXT,
    "status_history" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prep_trackers" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "application_id" TEXT,
    "company_name" TEXT NOT NULL,
    "round_name" TEXT NOT NULL DEFAULT 'Aptitude',
    "round_date" DATE,
    "notify_email" TEXT,
    "total_topics" INTEGER NOT NULL DEFAULT 0,
    "done_topics" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prep_trackers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prep_topics" (
    "id" TEXT NOT NULL,
    "tracker_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "day_slot" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prep_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_topic_logs" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "log_date" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_topic_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "applications_clerk_user_id_idx" ON "applications"("clerk_user_id");

-- CreateIndex
CREATE INDEX "applications_clerk_user_id_status_idx" ON "applications"("clerk_user_id", "status");

-- CreateIndex
CREATE INDEX "prep_trackers_clerk_user_id_idx" ON "prep_trackers"("clerk_user_id");

-- CreateIndex
CREATE INDEX "prep_trackers_application_id_idx" ON "prep_trackers"("application_id");

-- CreateIndex
CREATE INDEX "prep_topics_tracker_id_idx" ON "prep_topics"("tracker_id");

-- CreateIndex
CREATE INDEX "daily_topic_logs_topic_id_idx" ON "daily_topic_logs"("topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_topic_logs_topic_id_log_date_key" ON "daily_topic_logs"("topic_id", "log_date");

-- AddForeignKey
ALTER TABLE "prep_trackers" ADD CONSTRAINT "prep_trackers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prep_topics" ADD CONSTRAINT "prep_topics_tracker_id_fkey" FOREIGN KEY ("tracker_id") REFERENCES "prep_trackers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_topic_logs" ADD CONSTRAINT "daily_topic_logs_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "prep_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
