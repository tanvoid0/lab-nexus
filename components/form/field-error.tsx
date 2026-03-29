type FieldErrorProps = {
  errors?: string[];
};

/** First server action field error line, for consistent form UX. */
export function FieldError({ errors }: FieldErrorProps) {
  if (!errors?.length) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {errors.join(" ")}
    </p>
  );
}
