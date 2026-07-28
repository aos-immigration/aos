"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        {error.digest ? <p>{error.digest}</p> : null}
      </body>
    </html>
  );
}
