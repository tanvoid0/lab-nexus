"use client";

import { useFormStatus } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Button, type ButtonProps } from "@/components/ui/button";

export type SubmitButtonProps = ButtonProps & {
  pendingLabel?: string;
};

/**
 * Submit control for forms used with `useActionState` / `action={formAction}`.
 * Disables and shows a pending label while the server action runs.
 */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending ? (
        <>
          <FontAwesomeIcon icon={faSpinner} spin className="size-4" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
