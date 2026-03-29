"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

export function ContinueToAppLink() {
  return (
    <Link
      href="/"
      className="mt-4 inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
    >
      Continue to app (redirects if not signed in)
      <FontAwesomeIcon icon={faArrowRight} className="size-3.5" />
    </Link>
  );
}
