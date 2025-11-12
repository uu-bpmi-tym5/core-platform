-- Vytvoření tabulky wallet_tx pro historii transakcí
CREATE TABLE "wallet_tx" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" uuid NOT NULL,
    "type" varchar NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'CAMPAIGN_CONTRIBUTION', 'REFUND', 'BANK_WITHDRAWAL')),
    "amount" DECIMAL(10,2) NOT NULL,
    "status" varchar NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    "campaignId" uuid,
    "description" text,
    "externalReference" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
    FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE SET NULL
);

-- Přidání indexů pro optimalizaci dotazů
CREATE INDEX "IDX_wallet_tx_userId" ON "wallet_tx" ("userId");
CREATE INDEX "IDX_wallet_tx_type" ON "wallet_tx" ("type");
CREATE INDEX "IDX_wallet_tx_status" ON "wallet_tx" ("status");
CREATE INDEX "IDX_wallet_tx_campaignId" ON "wallet_tx" ("campaignId");
CREATE INDEX "IDX_wallet_tx_createdAt" ON "wallet_tx" ("createdAt" DESC);
