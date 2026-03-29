"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox } from "@fortawesome/free-solid-svg-icons";
import { CardTitle } from "@/components/ui/card";

export function ProjectAssignedInventoryTitle() {
  return (
    <CardTitle className="flex items-center gap-2 text-lg text-primary">
      <FontAwesomeIcon icon={faBox} className="size-5" />
      Assigned inventory
    </CardTitle>
  );
}
