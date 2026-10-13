-- AlterTable
ALTER TABLE "users" ADD COLUMN "login_pin_hash" TEXT;

-- CreateTable
CREATE TABLE "login_pin_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "remember" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_pin_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_pin_challenges_token_hash_key" ON "login_pin_challenges"("token_hash");

-- CreateIndex
CREATE INDEX "login_pin_challenges_user_id_expires_at_idx" ON "login_pin_challenges"("user_id", "expires_at");

-- AddForeignKey
ALTER TABLE "login_pin_challenges" ADD CONSTRAINT "login_pin_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
