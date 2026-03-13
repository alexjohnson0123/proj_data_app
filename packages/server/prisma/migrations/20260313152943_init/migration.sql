-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('string', 'number', 'date');

-- CreateTable
CREATE TABLE "ProjectType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProjectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeDefinition" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "dataType" "DataType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "projectTypeId" INTEGER NOT NULL,

    CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "workdayId" TEXT NOT NULL,
    "name" TEXT,
    "client" TEXT,
    "sphere" TEXT,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "projectTypeId" INTEGER,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeValue" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "attributeDefinitionId" INTEGER NOT NULL,
    "valueString" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueDate" TIMESTAMP(3),

    CONSTRAINT "AttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectType_name_key" ON "ProjectType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_projectTypeId_label_key" ON "AttributeDefinition"("projectTypeId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "Project_workdayId_key" ON "Project"("workdayId");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeValue_projectId_attributeDefinitionId_key" ON "AttributeValue"("projectId", "attributeDefinitionId");

-- AddForeignKey
ALTER TABLE "AttributeDefinition" ADD CONSTRAINT "AttributeDefinition_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "ProjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "ProjectType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
