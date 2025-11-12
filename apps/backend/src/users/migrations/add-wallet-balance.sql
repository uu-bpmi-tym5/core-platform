-- Přidání wallet balance sloupce do user tabulky
ALTER TABLE "user"
ADD COLUMN "walletBalance" DECIMAL(10,2) NOT NULL DEFAULT 0;

