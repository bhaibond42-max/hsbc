ALTER TABLE "users" ALTER COLUMN "hide_balances" SET DEFAULT true;
UPDATE "users" SET "hide_balances" = true WHERE "role" = 'USER';
