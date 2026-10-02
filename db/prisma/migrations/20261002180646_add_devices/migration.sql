-- CreateEnum
CREATE TYPE "device_status" AS ENUM ('online', 'offline', 'error');

-- CreateTable
CREATE TABLE "device_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seq" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "host" VARCHAR(253) NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 554,
    "path" VARCHAR(255) NOT NULL DEFAULT '',
    "username" VARCHAR(100) NOT NULL DEFAULT '',
    "password_enc" TEXT,
    "group_id" UUID,
    "model" VARCHAR(100),
    "firmware" VARCHAR(100),
    "status" "device_status" NOT NULL DEFAULT 'offline',
    "last_seen_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_groups_parent_id_name_key" ON "device_groups"("parent_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "devices_seq_key" ON "devices"("seq");

-- CreateIndex
CREATE INDEX "devices_group_id_idx" ON "devices"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_host_port_path_key" ON "devices"("host", "port", "path");

-- AddForeignKey
ALTER TABLE "device_groups" ADD CONSTRAINT "device_groups_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "device_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "device_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

