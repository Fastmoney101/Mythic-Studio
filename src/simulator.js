/**
 * Comparisons and numeric effects stay structured data; no rule parsing or
 * signed-string conventions are involved.
 *
 * @typedef {"gt" | "gte" | "lt" | "lte" | "eq"} ComparisonOperator
 * @typedef {"echoDensity" | "stability"} RealmMetric
 * @typedef {"strength" | "saturation"} MythosMetric
 * @typedef {{ id: string, name: string, climate: string, stability: number, echoDensity: number, eraId: "dawn_era" | "radiance_ascension_era" }} Realm
 * @typedef {{ id: string, name: string, realmId: string, sentiment: string, doctrine: string, tension: number }} Faction
 * @typedef {{ id: string, name: string, strength: number, saturation: number, bornAt: number }} MythosThread
 * @typedef {{ glyph: string, climate: string, ascension: string, revelation: string, currentRealm: string, present: boolean }} PlayerState
 * @typedef {{ type: "realm", realmId: string, metric: RealmMetric, operator: ComparisonOperator, value: number } | { type: "realm", realmId: string, metric: "climate", operator: "eq", value: string }} RealmCondition
 * @typedef {{ type: "faction", factionId: string, metric: "tension", operator: ComparisonOperator, value: number }} FactionCondition
 * @typedef {{ type: "mythos", mythosId: string, metric: MythosMetric, operator: ComparisonOperator, value: number }} MythosCondition
 * @typedef {{ type: "player", field: keyof PlayerState, operator: "eq", value: string | boolean }} PlayerCondition
 * @typedef {RealmCondition | FactionCondition | MythosCondition | PlayerCondition} Condition
 * @typedef {{ type: "realm", realmId: string, metric: RealmMetric, amount: number }} RealmEffect
 * @typedef {{ type: "faction", factionId: string, metric: "tension", amount: number }} FactionEffect
 * @typedef {{ type: "mythos", mythosId: string, metric: MythosMetric, amount: number }} MythosEffect
 * @typedef {{ type: "spawnMythos", thread: Omit<MythosThread, "bornAt"> }} SpawnMythosEffect
 * @typedef {RealmEffect | FactionEffect | MythosEffect | SpawnMythosEffect} Effect
 * @typedef {{ id: string, title: string, description: string, conditions: Condition[], effects: Effect[], weight: number, chainAfter?: string[] }} EventRule
 * @typedef {{ id: string, tick: number, eventId: string | null, title: string, description: string, reasons: string[], chainParentId: string | null }} HistoryEntry
 * @typedef {{ tick: number, seed: string, realms: Realm[], factions: Faction[], mythos: MythosThread[], eras: { id: Realm["eraId"], name: string }[], player: PlayerState, history: HistoryEntry[] }} WorldState
 */

export const INITIAL_STATE = Object.freeze({
  tick: 0,
  seed: "westreach-01",
  eras: [
    { id: "dawn_era", name: "Dawn Era" },
    { id: "radiance_ascension_era", name: "Radiance Ascension Era" },
  ],
  realms: [
    { id: "westreach", name: "Westreach", climate: "grief", stability: 0.8, echoDensity: 0.52, eraId: "dawn_era" },
    { id: "southlands", name: "Southlands", climate: "rage", stability: 0.6, echoDensity: 0.18, eraId: "radiance_ascension_era" },
  ],
  factions: [
    { id: "westreach_scribes", name: "Westreach Scribes", realmId: "westreach", sentiment: "fear", doctrine: "memory_preservers", tension: 0.55 },
  ],
  mythos: [
    { id: "echo_split", name: "The Echo Split", strength: 0.7, saturation: 0.66, bornAt: 0 },
  ],
  player: { glyph: "weave", climate: "grief", ascension: "crest", revelation: "medium", currentRealm: "westreach", present: true },
  history: [],
});

/** @type {EventRule[]} */
export const EVENT_RULES = [
  {
    id: "echo_ripple",
    title: "An echo ripples",
    description: "A remembered sorrow stirs through Westreach. Its boundaries thin, and the Scribes feel the strain.",
    weight: 5,
    conditions: [{ type: "realm", realmId: "westreach", metric: "echoDensity", operator: "gt", value: 0.4 }],
    effects: [
      { type: "realm", realmId: "westreach", metric: "echoDensity", amount: 0.08 },
      { type: "realm", realmId: "westreach", metric: "stability", amount: -0.025 },
      { type: "mythos", mythosId: "echo_split", metric: "saturation", amount: 0.025 },
      { type: "faction", factionId: "westreach_scribes", metric: "tension", amount: 0.01 },
    ],
  },
  {
    id: "memory_flood",
    title: "The memory flood",
    description: "Old lives break their banks. The Scribes cannot hold back the tide.",
    weight: 3,
    chainAfter: ["echo_ripple"],
    conditions: [
      { type: "realm", realmId: "westreach", metric: "echoDensity", operator: "gt", value: 0.75 },
      { type: "realm", realmId: "westreach", metric: "climate", operator: "eq", value: "grief" },
    ],
    effects: [
      { type: "realm", realmId: "westreach", metric: "echoDensity", amount: 0.1 },
      { type: "realm", realmId: "westreach", metric: "stability", amount: -0.12 },
      { type: "mythos", mythosId: "echo_split", metric: "saturation", amount: 0.08 },
      { type: "faction", factionId: "westreach_scribes", metric: "tension", amount: 0.04 },
    ],
  },
  {
    id: "echo_collapse",
    title: "The Echo Split collapses",
    description: "The thread gives way. From its severed edge, a new story is born: Frame Singularity.",
    weight: 1,
    conditions: [
      { type: "realm", realmId: "westreach", metric: "echoDensity", operator: "gt", value: 0.75 },
      { type: "realm", realmId: "westreach", metric: "stability", operator: "lt", value: 0.4 },
      { type: "player", field: "present", operator: "eq", value: true },
      { type: "player", field: "currentRealm", operator: "eq", value: "westreach" },
      { type: "player", field: "glyph", operator: "eq", value: "weave" },
      { type: "player", field: "climate", operator: "eq", value: "grief" },
      { type: "player", field: "revelation", operator: "eq", value: "medium" },
      { type: "faction", factionId: "westreach_scribes", metric: "tension", operator: "gt", value: 0.5 },
      { type: "mythos", mythosId: "echo_split", metric: "saturation", operator: "gt", value: 0.7 },
    ],
    effects: [
      { type: "realm", realmId: "westreach", metric: "stability", amount: -0.15 },
      { type: "mythos", mythosId: "echo_split", metric: "strength", amount: 0.15 },
      { type: "spawnMythos", thread: { id: "frame_singularity", name: "Frame Singularity", strength: 0.1, saturation: 0.05 } },
    ],
  },
];

const clamp = (value) => Math.min(1, Math.max(0, value));

/** @param {number} actual @param {ComparisonOperator} operator @param {number} expected */
function compare(actual, operator, expected) {
  switch (operator) {
    case "gt": return actual > expected;
    case "gte": return actual >= expected;
    case "lt": return actual < expected;
    case "lte": return actual <= expected;
    case "eq": return actual === expected;
    default: throw new Error(`Unsupported comparison operator: ${operator}`);
  }
}

/** @param {Condition} condition @param {WorldState} state */
function evaluateCondition(condition, state) {
  if (condition.type === "player") {
    const actual = state.player[condition.field];
    const matches = actual === condition.value;
    return { matches, reason: `player.${condition.field} ${matches ? "is" : "is not"} ${String(condition.value)}` };
  }
  const record = condition.type === "realm"
    ? state.realms.find((item) => item.id === condition.realmId)
    : condition.type === "faction"
      ? state.factions.find((item) => item.id === condition.factionId)
      : state.mythos.find((item) => item.id === condition.mythosId);
  if (!record) throw new Error(`Missing ${condition.type} referenced by event rule`);
  const actual = record[condition.metric];
  if (condition.type === "realm" && condition.metric === "climate") {
    const matches = actual === condition.value;
    return {
      matches,
      reason: `${condition.realmId}.climate ${matches ? "is" : "is not"} ${condition.value}`,
    };
  }
  const matches = compare(actual, condition.operator, condition.value);
  const label = condition.type === "realm"
    ? `${condition.realmId}.${condition.metric}`
    : condition.type === "faction"
      ? `${condition.factionId}.${condition.metric}`
      : `${condition.mythosId}.${condition.metric}`;
  return {
    matches,
    reason: `${label} ${matches ? "satisfies" : "does not satisfy"} ${condition.operator} ${condition.value.toFixed(2)} (current ${actual.toFixed(2)})`,
  };
}

/** @param {WorldState} state @param {EventRule[]} [rules] */
export function getEligibleEvents(state, rules = EVENT_RULES) {
  const previousEvent = state.history.at(-1)?.eventId ?? null;
  return rules.filter((rule) => {
    if (rule.chainAfter && !rule.chainAfter.includes(previousEvent ?? "")) return false;
    return rule.conditions.every((condition) => evaluateCondition(condition, state).matches);
  });
}

function hashSeed(seed) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFor(seed, tick) {
  let value = (hashSeed(seed) + Math.imul(tick + 1, 0x6d2b79f5)) >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

/** @param {EventRule[]} eligible @param {string} seed @param {number} tick */
function selectEvent(eligible, seed, tick) {
  const totalWeight = eligible.reduce((sum, rule) => sum + rule.weight, 0);
  let cursor = randomFor(seed, tick)() * totalWeight;
  for (const rule of eligible) {
    cursor -= rule.weight;
    if (cursor < 0) return rule;
  }
  return eligible.at(-1);
}

/** @param {WorldState} state @param {Effect[]} effects */
function applyEffects(state, effects) {
  for (const effect of effects) {
    if (effect.type === "spawnMythos") {
      if (!state.mythos.some((thread) => thread.id === effect.thread.id)) {
        state.mythos.push({ ...effect.thread, bornAt: state.tick + 1 });
      }
      continue;
    }
    const collection = effect.type === "realm" ? state.realms : effect.type === "faction" ? state.factions : state.mythos;
    const id = effect.type === "realm" ? effect.realmId : effect.type === "faction" ? effect.factionId : effect.mythosId;
    const target = collection.find((item) => item.id === id);
    if (!target) throw new Error(`Missing ${effect.type} referenced by event effect`);
    target[effect.metric] = clamp(target[effect.metric] + effect.amount);
  }
}

/**
 * Advances one tick on a fresh copy, so prior snapshots remain unchanged.
 * @param {WorldState} current
 * @param {{ seed?: string, rules?: EventRule[] }} [options]
 * @returns {WorldState}
 */
export function stepSimulation(current, options = {}) {
  const state = structuredClone(current);
  const seed = options.seed ?? state.seed;
  const rules = options.rules ?? EVENT_RULES;
  const eligible = getEligibleEvents(state, rules);
  const selected = eligible.length ? selectEvent(eligible, seed, state.tick) : null;
  const reasons = selected
    ? selected.conditions.map((condition) => evaluateCondition(condition, state).reason)
    : ["No event rule is currently eligible."];
  const chainParentId = selected?.chainAfter?.includes(state.history.at(-1)?.eventId ?? "")
    ? state.history.at(-1)?.id ?? null
    : null;

  if (selected) applyEffects(state, selected.effects);
  state.tick += 1;
  state.history.unshift({
    id: `${state.tick}-${selected?.id ?? "quiet"}`,
    tick: state.tick,
    eventId: selected?.id ?? null,
    title: selected?.title ?? "A quiet turn",
    description: selected?.description ?? "The world settles. No mythic event meets its conditions.",
    reasons,
    chainParentId,
  });
  return state;
}

/** Returns an independent copy of the sample starting world. */
export function createInitialState(seed = INITIAL_STATE.seed) {
  return { ...structuredClone(INITIAL_STATE), seed };
}
