-- Vytvoření tabulky campaign_contribution pro příspěvky k kampaním
CREATE TABLE "campaign_contribution" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "campaignId" uuid NOT NULL,
    "contributorId" uuid NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "walletTxId" uuid,
    "message" text,
    "isRefunded" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE,
    FOREIGN KEY ("contributorId") REFERENCES "user"("id") ON DELETE CASCADE,
    FOREIGN KEY ("walletTxId") REFERENCES "wallet_tx"("id") ON DELETE SET NULL
);

-- Přidání indexů pro optimalizaci dotazů
CREATE INDEX "IDX_campaign_contribution_campaignId" ON "campaign_contribution" ("campaignId");
CREATE INDEX "IDX_campaign_contribution_contributorId" ON "campaign_contribution" ("contributorId");
CREATE INDEX "IDX_campaign_contribution_isRefunded" ON "campaign_contribution" ("isRefunded");
CREATE INDEX "IDX_campaign_contribution_createdAt" ON "campaign_contribution" ("createdAt" DESC);
