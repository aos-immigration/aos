"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
    return (
        <div>
            <h2>Sentry Example Page</h2>
            <p>
                Click the button below to throw an error and verify that Sentry is
                capturing errors correctly.
            </p>
            <button
                type="button"
                onClick={async () => {
                    const transaction = Sentry.startSpan(
                        {
                            name: "Example Frontend Span",
                            op: "test",
                        },
                        async () => {
                            const res = await fetch("/api/sentry-example-api");
                            if (!res.ok) {
                                throw new Error("Sentry Example Frontend Error");
                            }
                        }
                    );
                }}
            >
                Throw Sample Error
            </button>
        </div>
    );
}
