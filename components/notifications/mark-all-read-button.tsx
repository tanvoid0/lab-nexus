"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckDouble } from "@fortawesome/free-solid-svg-icons";
import { markAllNotificationsRead } from "@/lib/actions/notification";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (disabled) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      className="gap-2"
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsRead();
          router.refresh();
        })
      }
    >
      <FontAwesomeIcon icon={faCheckDouble} className="size-3.5" />
      Mark all read
    </Button>
  );
}
