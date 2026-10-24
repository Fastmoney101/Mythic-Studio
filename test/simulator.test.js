import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, EVENT_RULES, getEligibleEvents, stepSimulation } from "../src/simulator.js";

function setValue(state, collection, id, field, value) {
  state[collection].find((item) => item.id === id)[field] = value;
}

test("echo ripple uses a strict greater-than echo-density threshold", () => {
  const state = createInitialState();
  setValue(state, "realms", "westreach", "echoDensity", 0.4);
  assert.equal(getEligibleEvents(state).some((rule) => rule.id === "echo_ripple"), false);
  setValue(state, "realms", "westreach", "echoDensity", 0.401);
  assert.equal(getEligibleEvents(state).some((rule) => rule.id === "echo_ripple"), true);
});

test("a step changes typed state, increments tick, and records why the event fired", () => {
  const state = createInitialState();
  const next = stepSimulation(state);
  const westreach = next.realms.find((realm) => realm.id === "westreach");
  const echoSplit = next.mythos.find((thread) => thread.id === "echo_split");
  assert.equal(next.tick, 1);
  assert.equal(next.history[0].eventId, "echo_ripple");
  assert.equal(westreach.echoDensity, 0.6);
  assert.equal(westreach.stability, 0.775);
  assert.equal(echoSplit.saturation, 0.685);
  assert.match(next.history[0].reasons[0], /satisfies gt/);
  assert.equal(state.tick, 0);
  assert.equal(state.realms[0].echoDensity, 0.52);
});

test("memory flood requires Westreach echoes, grief climate, and a preceding ripple", () => {
  const state = createInitialState();
  setValue(state, "realms", "westreach", "echoDensity", 0.8);
  setValue(state, "realms", "westreach", "climate", "wonder");
  assert.equal(getEligibleEvents(state).some((rule) => rule.id === "memory_flood"), false);
  setValue(state, "realms", "westreach", "climate", "grief");
  state.history.push({ id: "prior-ripple", tick: 1, eventId: "echo_ripple", title: "Ripple", description: "", reasons: [], chainParentId: null });
  assert.equal(getEligibleEvents(state).some((rule) => rule.id === "memory_flood"), true);
  const next = stepSimulation(state, { rules: [EVENT_RULES.find((rule) => rule.id === "memory_flood")] });
  assert.equal(next.history[0].eventId, "memory_flood");
  assert.equal(next.history[0].chainParentId, "prior-ripple");
  assert.equal(next.realms.find((realm) => realm.id === "westreach").stability, 0.68);
});

test("collapse checks the full confluence and births Frame Singularity without replacing Echo Split", () => {
  const state = createInitialState();
  setValue(state, "realms", "westreach", "echoDensity", 0.9);
  setValue(state, "realms", "westreach", "stability", 0.3);
  setValue(state, "mythos", "echo_split", "saturation", 0.8);
  assert.equal(getEligibleEvents(state).some((rule) => rule.id === "echo_collapse"), true);
  state.player.glyph = "ember";
  assert.equal(getEligibleEvents(state).some((rule) => rule.id === "echo_collapse"), false);
  state.player.glyph = "weave";
  const next = stepSimulation(state, { rules: [EVENT_RULES.find((rule) => rule.id === "echo_collapse")] });
  assert.equal(next.history[0].eventId, "echo_collapse");
  assert.deepEqual(next.mythos.map((thread) => thread.id), ["echo_split", "frame_singularity"]);
  assert.equal(next.mythos[1].bornAt, 1);
  assert.notEqual(next.eras[0].id, next.eras[1].id);
});

test("the same seed and initial world yield repeatable events and history", () => {
  let first = createInitialState();
  let second = createInitialState();
  for (let turn = 0; turn < 12; turn += 1) {
    first = stepSimulation(first, { seed: "repeatable-seed" });
    second = stepSimulation(second, { seed: "repeatable-seed" });
  }
  assert.deepEqual(first, second);
  assert.ok(first.history.some((entry) => entry.eventId === "memory_flood"));
});

test("a quiet turn still advances tick and is recorded", () => {
  const state = createInitialState();
  setValue(state, "realms", "westreach", "echoDensity", 0.2);
  const next = stepSimulation(state);
  assert.equal(next.tick, 1);
  assert.equal(next.history[0].eventId, null);
  assert.match(next.history[0].description, /No mythic event/);
});
