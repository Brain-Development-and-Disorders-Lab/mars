// React
import React from "react";

// Components
import DialogImportReviewTable from "@components/DialogImportReviewTable";

// Existing and custom types
import { AttributeReviewStepProps } from "@types";

// Variables
import { STYLES } from "@variables";

const AttributeReviewStep = ({ reviewAttributes }: AttributeReviewStepProps) => (
  <DialogImportReviewTable
    items={reviewAttributes}
    icon={"attribute"}
    iconColor={STYLES.attribute.color.icon}
    bg={STYLES.attribute.color.light}
    borderColor={STYLES.attribute.color.border}
    nameHeader={"Attribute Name"}
    singular={"Attribute"}
    plural={"Attributes"}
  />
);

export default AttributeReviewStep;
