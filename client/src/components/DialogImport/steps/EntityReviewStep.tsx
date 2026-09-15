// React
import React from "react";

// Components
import DialogImportReviewTable from "@components/DialogImportReviewTable";

// Existing and custom types
import { EntityReviewStepProps } from "@types";

// Variables
import { STYLES } from "@variables";

const EntityReviewStep = ({ reviewEntities }: EntityReviewStepProps) => (
  <DialogImportReviewTable
    items={reviewEntities}
    icon={"entity"}
    iconColor={STYLES.entity.color.icon}
    bg={STYLES.entity.color.light}
    borderColor={STYLES.entity.color.border}
    nameHeader={"Entity Name"}
    singular={"Entity"}
    plural={"Entities"}
    showWarnings
  />
);

export default EntityReviewStep;
