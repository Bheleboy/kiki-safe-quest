import { afterEach, describe, expect, it, vi } from "vitest";
import { mount, act } from "@/test/mount";

const auth = vi.hoisted(() => ({ isAdmin: true }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" }, profile: { is_admin: auth.isAdmin }, session: { access_token: "t" } }),
  callFn: vi.fn(async () => ({ ok: true, status: 200, data: { has_pin: true } })),
}));

// The real PIN boxes start timers that outlive the test; simple stand-ins are enough here.
vi.mock("@/components/ui/input-otp", () => ({
  InputOTP: ({ children }: { children?: unknown }) => children,
  InputOTPGroup: ({ children }: { children?: unknown }) => children,
  InputOTPSlot: () => null,
}));

import { useParentPin } from "./ParentGate";

// The PIN pad uses ResizeObserver, which the test browser lacks.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

let cleanup: (() => void) | null = null;
afterEach(() => { cleanup?.(); cleanup = null; sessionStorage.clear(); });

function harness() {
  let api: ReturnType<typeof useParentPin> | null = null;
  function H() { api = useParentPin(); return api.dialog; }
  const m = mount(<H />);
  cleanup = m.unmount;
  return () => api!;
}

describe("existing guard() behaviour is unchanged", () => {
  it("admins skip the PIN for plain and force guards, as before", () => {
    auth.isAdmin = true;
    const get = harness();
    const a = vi.fn(); const b = vi.fn();
    act(() => get().guard(a));
    act(() => get().guard(b, { force: true }));
    expect(a).toHaveBeenCalledWith(undefined);
    expect(b).toHaveBeenCalledWith(undefined);
  });

  it("requirePin asks admins too", () => {
    auth.isAdmin = true;
    const get = harness();
    const a = vi.fn();
    act(() => get().guard(a, { requirePin: true }));
    expect(a).not.toHaveBeenCalled();
  });

  it("parents inside the unlock window skip plain guards but not force", () => {
    auth.isAdmin = false;
    sessionStorage.setItem("kw_parent_unlock", JSON.stringify({ uid: "u1", until: Date.now() + 60_000 }));
    const get = harness();
    const a = vi.fn(); const b = vi.fn();
    act(() => get().guard(a));
    act(() => get().guard(b, { force: true }));
    expect(a).toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });
});
