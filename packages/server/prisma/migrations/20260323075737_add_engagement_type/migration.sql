-- CreateTable
CREATE TABLE "EngagementType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "EngagementType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EngagementTypeToProject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_EngagementTypeToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "EngagementType_name_key" ON "EngagementType"("name");

-- CreateIndex
CREATE INDEX "_EngagementTypeToProject_B_index" ON "_EngagementTypeToProject"("B");

-- AddForeignKey
ALTER TABLE "_EngagementTypeToProject" ADD CONSTRAINT "_EngagementTypeToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "EngagementType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EngagementTypeToProject" ADD CONSTRAINT "_EngagementTypeToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
