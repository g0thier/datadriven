import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSnapshot } from "../helpers/firebaseTestUtils.js";

const get = vi.fn();
const onChildAdded = vi.fn();
const onDisconnect = vi.fn();
const onValue = vi.fn();
const push = vi.fn();
const ref = vi.fn((_db, path = "") => path || "root");
const remove = vi.fn();
const set = vi.fn();
const update = vi.fn();

vi.mock("firebase/database", () => ({
  get,
  onChildAdded,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
}));
vi.mock("../../src/firebase/app", () => ({ database: {} }));

describe("firebase/workshop-voice.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue(makeSnapshot({ p1: { id: "p1" }, p2: { id: "p2" } }));
    set.mockResolvedValue(undefined);
    update.mockResolvedValue(undefined);
    remove.mockResolvedValue(undefined);
    push.mockReturnValue({ key: "sig1" });
    onValue.mockImplementation((_r, cb) => {
      cb(makeSnapshot({ p1: { id: "p1", name: "Ada" } }));
      return () => {};
    });
    onChildAdded.mockImplementation((_r, cb) => {
      cb({ exists: () => true, key: "sig1", val: () => ({ from: "p2", type: "offer" }) });
      return () => {};
    });
    onDisconnect.mockReturnValue({ remove: vi.fn().mockResolvedValue(undefined), cancel: vi.fn().mockResolvedValue(undefined) });
  });

  it("gets/sets/touches/removes participants", async () => {
    const mod = await import("../../src/firebase/workshop-voice.service.js");

    await expect(mod.getWorkshopVoiceParticipantCount("r1")).resolves.toBe(2);
    await mod.setWorkshopVoiceParticipant("r1", { id: "p1", name: "Ada" });
    await mod.touchWorkshopVoiceParticipant("r1", "p1");
    await mod.removeWorkshopVoiceParticipant("r1", "p1");

    expect(set).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
  });

  it("subscribes participants and signals, sends and acks signal", async () => {
    const mod = await import("../../src/firebase/workshop-voice.service.js");

    const cbParticipants = vi.fn();
    mod.subscribeWorkshopVoiceParticipants("r1", cbParticipants);
    expect(cbParticipants).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: "p1" })]));

    const cbSignals = vi.fn();
    mod.subscribeWorkshopVoiceSignals("r1", "p1", cbSignals);
    expect(cbSignals).toHaveBeenCalledWith(expect.objectContaining({ id: "sig1", type: "offer" }));

    await expect(mod.sendWorkshopVoiceSignal("r1", "p2", { from: "p1", type: "offer" })).resolves.toBe("sig1");
    await mod.ackWorkshopVoiceSignal("r1", "p1", "sig1");

    expect(set).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
  });

  it("registers disconnect cleanup", async () => {
    const mod = await import("../../src/firebase/workshop-voice.service.js");
    const cancel = await mod.registerWorkshopVoiceDisconnectCleanup("r1", "p1");
    expect(typeof cancel).toBe("function");
    await cancel();
  });
});
