-- CreateTable
CREATE TABLE "login_monitor_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" UUID,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "ip_location_label" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "accuracy_meters" DOUBLE PRECISION,
    "location_label" TEXT,
    "geo_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_monitor_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_monitor_events_created_at_idx" ON "login_monitor_events"("created_at");

-- CreateIndex
CREATE INDEX "login_monitor_events_user_id_created_at_idx" ON "login_monitor_events"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "login_monitor_events" ADD CONSTRAINT "login_monitor_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
