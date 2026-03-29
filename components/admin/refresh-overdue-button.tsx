"use client";

import { useTransition } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { refreshOverdueStatusAction } from "@/lib/actions/refresh-overdue";
import { Button } from "@/components/ui/button";

export function RefreshOverdueButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      className="gap-2"
      onClick={() =>
        startTransition(async () => {
          const r = await refreshOverdueStatusAction();
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          if (r.updated === 0) {
            toast.message("No newly overdue checkouts.");
          } else {
            toast.success(
              `Marked ${r.updated} checkout${r.updated === 1 ? "" : "s"} overdue (notifications sent if configured).`,
            );
          }
        })
      }
    >
      <FontAwesomeIcon
        icon={faRotate}
        className={`size-4 ${pending ? "animate-spin" : ""}`}
      />
      Refresh overdue
    </Button>
  );
}
