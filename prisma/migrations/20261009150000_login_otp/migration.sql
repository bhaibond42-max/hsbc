CREATE TABLE IF NOT EXISTS "login_otp_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_otp_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "login_otp_challenges_user_id_expires_at_idx" ON "login_otp_challenges"("user_id", "expires_at");

ALTER TABLE "login_otp_challenges" ADD CONSTRAINT "login_otp_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
