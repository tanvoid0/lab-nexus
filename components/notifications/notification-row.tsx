"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCheck } from "@fortawesome/free-solid-svg-icons";
import { markNotificationRead } from "@/lib/actions/notification";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NotificationRow({
  id,
  title,
  body,
  createdAtLabel,
  read,
}: {
  id: string;
  title: string;
  body: string;
  createdAtLabel: string;
  read: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <li>
      <Card
        className={
          read ? "border-border opacity-70" : "border-primary/30 shadow-sm"
        }
      >
        <CardHeader className="flex flex-row items-start gap-3 py-3">
          <span
            className={
              read
                ? "text-muted-foreground"
                : "text-primary"
            }
            aria-hidden
          >
            <FontAwesomeIcon icon={faBell} className="size-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{createdAtLabel}</CardDescription>
          </div>
          {!read ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0 gap-1.5"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const fd = new FormData();
                  fd.set("notificationId", id);
                  await markNotificationRead(fd);
                  router.refresh();
                })
              }
            >
              <FontAwesomeIcon icon={faCheck} className="size-3.5" />
              Mark read
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="pb-3 pt-0 pl-[2.35rem] text-sm">{body}</CardContent>
      </Card>
    </li>
  );
}
