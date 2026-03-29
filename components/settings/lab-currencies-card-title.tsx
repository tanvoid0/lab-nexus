"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins } from "@fortawesome/free-solid-svg-icons";
import { CardTitle } from "@/components/ui/card";

export function LabCurrenciesCardTitle() {
  return (
    <CardTitle className="flex items-center gap-2 text-primary">
      <FontAwesomeIcon icon={faCoins} className="size-5" />
      Lab currencies
    </CardTitle>
  );
}
