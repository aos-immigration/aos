const RETRY_DELAYS_MS = [50, 100];

export type DeleteAccountDeps = {
  purge: () => Promise<{ deleted: number }>;
  deleteClerkUser: () => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
};

function statusOf(error: unknown): number | undefined {
  if (typeof error === "object" && error && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

export function clerkUserAlreadyGone(error: unknown): boolean {
  return statusOf(error) === 404;
}

function retryable(error: unknown): boolean {
  const status = statusOf(error);
  if (status === undefined) return true;
  return status === 429 || status >= 500;
}

async function defaultSleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deleteAccount(deps: DeleteAccountDeps): Promise<{ deleted: number }> {
  const deleted = await deps.purge();
  const sleep = deps.sleep ?? defaultSleep;
  let attempt = 0;
  for (;;) {
    try {
      await deps.deleteClerkUser();
      return deleted;
    } catch (error) {
      if (clerkUserAlreadyGone(error)) return deleted;
      attempt += 1;
      const delay = RETRY_DELAYS_MS[attempt - 1];
      if (!retryable(error) || delay === undefined) throw error;
      await sleep(delay);
    }
  }
}
