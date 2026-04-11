export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function isPlaintextPasswordHash(storedPassword: string) {
  return String(storedPassword || "").startsWith("plain:");
}

export function assertPlaintextPasswordHashAllowed(storedPassword: string) {
  if (isProductionRuntime() && isPlaintextPasswordHash(storedPassword)) {
    throw new Error("Plain text passwords are not allowed in production.");
  }
}
