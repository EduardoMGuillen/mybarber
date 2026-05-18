CREATE TABLE IF NOT EXISTS "clients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "shop_id" uuid NOT NULL REFERENCES "shops"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "phone_normalized" text NOT NULL,
  "email" text,
  "email_normalized" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "clients_shop_id_idx" ON "clients" ("shop_id");
CREATE INDEX IF NOT EXISTS "clients_shop_email_idx" ON "clients" ("shop_id", "email_normalized");
CREATE INDEX IF NOT EXISTS "clients_shop_phone_idx" ON "clients" ("shop_id", "phone_normalized");

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "client_id" uuid REFERENCES "clients"("id") ON DELETE SET NULL;

INSERT INTO "clients" ("shop_id", "name", "phone", "phone_normalized", "email", "email_normalized", "created_at", "updated_at")
SELECT DISTINCT ON (a."shop_id", regexp_replace(a."client_phone", '\D', '', 'g'))
  a."shop_id",
  a."client_name",
  a."client_phone",
  regexp_replace(a."client_phone", '\D', '', 'g'),
  NULLIF(lower(trim(a."client_email")), ''),
  NULLIF(lower(trim(a."client_email")), ''),
  a."created_at",
  a."updated_at"
FROM "appointments" a
ORDER BY a."shop_id", regexp_replace(a."client_phone", '\D', '', 'g'), a."created_at" DESC;

UPDATE "appointments" a
SET "client_id" = c."id"
FROM "clients" c
WHERE a."client_id" IS NULL
  AND c."shop_id" = a."shop_id"
  AND c."phone_normalized" = regexp_replace(a."client_phone", '\D', '', 'g');
