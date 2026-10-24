import { createInitialState, stepSimulation } from "./simulator.js";

let state = createInitialState();
const $ = (selector) => document.querySelector(selector);
const tickValue = $("#tick-value");
const realmList = $("#realm-list");
const mythosList = $("#mythos-list");
const historyList = $("#history-list");
const emptyState = $("#empty-state");
const historyCount = $("#history-count");
const seedInput = $("#seed-input");

const percent = (value) => `${Math.round(value * 100)}%`;
const metric = (label, value, extra = "") => `
  <div class="metric">
    <div class="metric-line"><span>${label}</span><span class="metric-value">${percent(value)}</span></div>
    <div class="meter"><div class="meter-fill ${extra}" style="width:${percent(value)}"></div></div>
  </div>`;

function render() {
  tickValue.textContent = String(state.tick).padStart(3, "0");
  realmList.innerHTML = state.realms.map((realm) => {
    const era = state.eras.find((item) => item.id === realm.eraId);
    const faction = state.factions.find((item) => item.realmId === realm.id);
    return `<article class="realm-card">
      <div class="realm-line"><span class="realm-name">${realm.name}</span><span class="realm-era">${era?.name ?? realm.eraId}</span></div>
      <div class="realm-mood">${realm.climate} · ${faction ? `${faction.name} / ${faction.sentiment} · ${faction.doctrine}` : "Uncharted"}</div>
      ${metric("Stability", realm.stability)}
      ${metric("Echo density", realm.echoDensity, "echo")}
      ${faction ? metric("Faction tension", faction.tension) : ""}
    </article>`;
  }).join("");

  mythosList.innerHTML = state.mythos.map((thread) => `<article class="mythos-card">
    <div class="mythos-info"><h3>${thread.name}</h3><p>${thread.id} · BORN TICK ${thread.bornAt}</p>${metric("Saturation", thread.saturation, "echo")}</div>
    <span class="mythos-strength">${percent(thread.strength)}</span>
  </article>`).join("");

  historyCount.textContent = `${state.history.length} ${state.history.length === 1 ? "ENTRY" : "ENTRIES"}`;
  emptyState.classList.toggle("visible", state.history.length === 0);
  historyList.innerHTML = state.history.map((entry) => `<article class="history-entry ${entry.eventId ? "" : "no-event"}">
    <div class="history-meta"><span class="event-tick">TICK ${String(entry.tick).padStart(3, "0")}</span><span>${entry.eventId ?? "NO EVENT"}</span></div>
    <h3>${entry.title}</h3><p>${entry.description}</p>
    <p class="reason">${entry.reasons.join(" · ")}${entry.chainParentId ? " · Chained from the previous event" : ""}</p>
  </article>`).join("");
}

function syncPlayer() {
  state.player.glyph = $("#glyph-input").value;
  state.player.climate = $("#climate-input").value;
  state.player.ascension = $("#ascension-input").value;
  state.player.revelation = $("#revelation-input").value;
  state.player.present = $("#presence-input").checked;
}

$("#advance-button").addEventListener("click", () => {
  syncPlayer();
  state = stepSimulation(state, { seed: seedInput.value.trim() || "westreach-01" });
  render();
});

$("#reset-button").addEventListener("click", () => {
  state = createInitialState(seedInput.value.trim() || "westreach-01");
  $("#glyph-input").value = state.player.glyph;
  $("#climate-input").value = state.player.climate;
  $("#ascension-input").value = state.player.ascension;
  $("#revelation-input").value = state.player.revelation;
  $("#presence-input").checked = state.player.present;
  render();
});

render();
