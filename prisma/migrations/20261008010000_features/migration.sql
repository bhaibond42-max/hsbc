ALTER TABLE "accounts" ADD COLUMN "contactless_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "accounts" ADD COLUMN "online_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "accounts" ADD COLUMN "atm_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "accounts" ADD COLUMN "daily_limit" DECIMAL(14,2) NOT NULL DEFAULT 500;

CREATE TABLE "direct_debits" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "reference" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "next_date" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "direct_debits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "savings_goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "target_amount" DECIMAL(14,2) NOT NULL,
    "saved_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "direct_debits_user_id_idx" ON "direct_debits"("user_id");
CREATE INDEX "savings_goals_user_id_idx" ON "savings_goals"("user_id");

ALTER TABLE "direct_debits" ADD CONSTRAINT "direct_debits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "direct_debits" ADD CONSTRAINT "direct_debits_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
