import { emptyIntake } from "./empty";
import type { Intake } from "./schema";

let current = emptyIntake();

export function memoryIntake(): Intake {
  return current;
}

export function setMemoryIntake(next: Intake): void {
  current = next;
}

export function resetMemoryIntake(): void {
  current = emptyIntake();
}
