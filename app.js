"use strict";

const STORAGE_KEY = "venueCart.v1";
const $ = (id) => document.getElementById(id);
const money = (n) => "$" + n;

const viewport = $("viewport");
const world = $("world");

const seats = new Map(); 
const seatEls = new Map(); 
let cart = [];             
let inspectedId = null;

/* ---------- Model generation ---------- */

// Deterministic pseudo-random so the same seats are always sold.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

function buildModel() {
  const pitch = VENUE.seatSize + VENUE.seatGap;
  VENUE.sections.forEach((sec) => {
    const cat = VENUE.categories[sec.category];
    for (let r = 0; r < sec.rows; r++) {
      const row = String.fromCharCode(sec.firstRow.charCodeAt(0) + r);
      for (let n = 1; n <= sec.seatsPerRow; n++) {
        const id = `${sec.id}-${row}${n}`;
        const sold = (sec.blocked || []).includes(row + n) || hash(id) < VENUE.soldRatio;
        seats.set(id, {
          id, section: sec, sectionName: sec.name, row, number: n,
          category: cat, price: cat.price, unavailable: sold,
          x: sec.x + (n - 1) * pitch + 16, // 16px left for the row label
          y: sec.y + r * pitch
        });
      }
    }
  });
}

/* ---------- Rendering the map ---------- */

function el(tag, cls, styles, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (styles) Object.assign(e.style, styles);
  if (text) e.textContent = text;
  return e;
}

function renderMap() {
  const pitch = VENUE.seatSize + VENUE.seatGap;
  world.style.width = VENUE.width + "px";
  world.style.height = VENUE.height + "px";

  const st = VENUE.stage;
  world.appendChild(el("div", "stage", { left: st.x + "px", top: st.y + "px", width: st.w + "px", height: st.h + "px" }, st.label));
  VENUE.labels.forEach((l) =>
    world.appendChild(el("div", "zone-note", { left: l.x + "px", top: l.y + "px", width: l.w + "px" }, l.text)));

  const frag = document.createDocumentFragment();
  VENUE.sections.forEach((sec) => {
    const cat = VENUE.categories[sec.category];
    frag.appendChild(el("div", "section-label", { left: sec.x + 16 + "px", top: sec.y - 20 + "px" },
      `${sec.name} · ${cat.name} ${money(cat.price)}`));
    for (let r = 0; r < sec.rows; r++) {
      frag.appendChild(el("div", "row-label", { left: sec.x + "px", top: sec.y + r * pitch + "px" },
        String.fromCharCode(sec.firstRow.charCodeAt(0) + r)));
    }
  });

  seats.forEach((s) => {
    const b = el("button", "seat", { left: s.x + "px", top: s.y + "px", "--seat-color": s.category.color }, String(s.number));
    b.type = "button";
    b.dataset.id = s.id;
    seatEls.set(s.id, b);
    frag.appendChild(b);
  });
  world.appendChild(frag);
}

function renderLegend() {
  const ul = $("legend");
  Object.values(VENUE.categories).forEach((c) => {
    const li = el("li");
    li.appendChild(el("span", "swatch", { background: c.color }));
    li.appendChild(document.createTextNode(`${c.name} ${money(c.price)}`));
    ul.appendChild(li);
  });
  [["sold", "Unavailable"], ["inspected", "Inspected"], ["incart", "In cart"]].forEach(([c, t]) => {
    const li = el("li");
    li.appendChild(el("span", "swatch " + c));
    li.appendChild(document.createTextNode(t));
    ul.appendChild(li);
  });
}
/* ---------- Seat state / UI sync ---------- */

function seatState(s) {
  if (s.unavailable) return "unavailable";
  return cart.includes(s.id) ? "in-cart" : "available";
}

function seatLabel(s) {
  return `${s.sectionName}, row ${s.row}, seat ${s.number}`;
}

function refreshSeat(id) {
  const s = seats.get(id), b = seatEls.get(id);
  if (!s || !b) return;
  const state = seatState(s);
  b.classList.toggle("unavailable", state === "unavailable");
  b.classList.toggle("in-cart", state === "in-cart");
  b.classList.toggle("inspected", id === inspectedId);
  b.setAttribute("aria-disabled", state === "unavailable");
  b.setAttribute("aria-pressed", id === inspectedId);
  b.setAttribute("aria-label", `${seatLabel(s)}, ${money(s.price)}, ${state.replace("-", " ")}`);
}

function renderDetails() {
  const box = $("details"), btn = $("addBtn");
  const s = seats.get(inspectedId);
  if (!s) {
    box.innerHTML = "<p class="muted">No seat selected. Click a seat on the map.</p>";
    btn.disabled = true; btn.textContent = "ADD TO CART";
    return;
  }
  const state = seatState(s);
  const label = { available: "Available", "in-cart": "In your cart", unavailable: "Unavailable" }[state];
  box.innerHTML = `<dl>
    <dt>Section</dt><dd>${s.sectionName}</dd>
    <dt>Row</dt><dd>${s.row}</dd>
    <dt>Seat</dt><dd>${s.number}</dd>
    <dt>Category</dt><dd>${s.category.name}</dd>
    <dt>Price</dt><dd>${money(s.price)}</dd>
    <dt>Status</dt><dd><span class="status ${state}">${label}</span></dd>
  </dl>`;
  btn.disabled = state !== "available";
  btn.textContent = state === "in-cart" ? "ALREADY IN CART" : state === "unavailable" ? "UNAVAILABLE" : "ADD TO CART";
}

function renderCart() {
  const list = $("cartList");
  list.innerHTML = "";
  let total = 0;
  cart.forEach((id) => {
    const s = seats.get(id);
    total += s.price;
    const li = el("li");
    const info = el("div", "info");
    info.appendChild(document.createTextNode(`${s.sectionName} · ${s.row}${s.number}`));
    info.appendChild(el("small", null, null, `${s.category.name} · ${money(s.price)}`));
    const rm = el("button", "remove", null, "Remove");
    rm.type = "button";
    rm.dataset.id = id;
    rm.setAttribute("aria-label", `Remove ${seatLabel(s)} from cart`);
    li.append(info, rm);
    list.appendChild(li);
  });
  $("cartCount").textContent = cart.length;
  $("cartEmpty").hidden = cart.length > 0;
  $("total").textContent = money(total);
  $("clearBtn").disabled = cart.length === 0;
}

function say(msg) { $("message").textContent = msg; }

/* ---------- Persistence ---------- */

function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* storage unavailable */ }
}

function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(data)) return [];
    // keep only valid, available, unique seats
    return [...new Set(data)].filter((id) => seats.has(id) && !seats.get(id).unavailable);
  } catch (e) { return []; }
}

/* ---------- Actions ---------- */

function inspect(id) {
  const prev = inspectedId;
  inspectedId = id;
  if (prev) refreshSeat(prev);
  refreshSeat(id);
  renderDetails();
  say(seats.get(id).unavailable ? "This seat is unavailable and cannot be added." : "");
}

function addToCart() {
  const s = seats.get(inspectedId);
  if (!s) return;
  if (s.unavailable) return say("This seat is unavailable.");
  if (cart.includes(s.id)) return say("That seat is already in your cart.");
  cart.push(s.id);
  saveCart();
  refreshSeat(s.id);
  renderCart(); renderDetails();
  say(`Added ${seatLabel(s)}.`);
}

function removeFromCart(id) {
  cart = cart.filter((x) => x !== id);
  saveCart();
  refreshSeat(id);
  renderCart(); renderDetails();
  say("Ticket removed.");
}

world.addEventListener("click", (e) => {
  const b = e.target.closest(".seat");
  if (b) inspect(b.dataset.id);
});
$("addBtn").addEventListener("click", addToCart);
$("cartList").addEventListener("click", (e) => {
  const b = e.target.closest(".remove");
  if (b) removeFromCart(b.dataset.id);
});
$("clearBtn").addEventListener("click", () => {
  const ids = cart.slice();
  cart = []; saveCart();
  ids.forEach(refreshSeat);
  renderCart(); renderDetails(); say("Cart cleared.");
});

/* ---------- Pan & zoom ---------- */

const view = { scale: 1, x: 0, y: 0, fit: 1 };
const MAX_SCALE = 3, STEP = 1.25;

function fitScale() {
  return Math.min(viewport.clientWidth / VENUE.width, viewport.clientHeight / VENUE.height);
}

function clamp() {
  const vw = viewport.clientWidth, vh = viewport.clientHeight;
  const w = VENUE.width * view.scale, h = VENUE.height * view.scale;
  view.x = w <= vw ? (vw - w) / 2 : Math.min(0, Math.max(vw - w, view.x));
  view.y = h <= vh ? (vh - h) / 2 : Math.min(0, Math.max(vh - h, view.y));
}

function apply() {
  clamp();
  world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
}

function zoomAt(factor, cx, cy) {
  const next = Math.min(MAX_SCALE, Math.max(view.fit, view.scale * factor));
  const k = next / view.scale;
  view.x = cx - (cx - view.x) * k;
  view.y = cy - (cy - view.y) * k;
  view.scale = next;
  apply();
}

function resetView() {
  view.fit = fitScale();
  view.scale = view.fit;
  view.x = view.y = 0;
  apply();
}

function pan(dx, dy) { view.x += dx; view.y += dy; apply(); }

const center = () => [viewport.clientWidth / 2, viewport.clientHeight / 2];
$("zoomIn").onclick = () => zoomAt(STEP, ...center());
$("zoomOut").onclick = () => zoomAt(1 / STEP, ...center());
// "Move up" shows content further up the map, i.e. the world moves down.
$("moveUp").onclick = () => pan(0, 100);
$("moveDown").onclick = () => pan(0, -100);
$("moveLeft").onclick = () => pan(100, 0);
$("moveRight").onclick = () => pan(-100, 0);
$("reset").onclick = resetView;

window.addEventListener("resize", () => {
  const wasFit = Math.abs(view.scale - view.fit) < 1e-6;
  view.fit = fitScale();
  if (wasFit || view.scale < view.fit) view.scale = view.fit;
  apply();
});

/* ---------- Init ---------- */

buildModel();
renderLegend();
renderMap();
cart = loadCart();
seats.forEach((_, id) => refreshSeat(id));
renderCart();
renderDetails();
resetView();
world.addEventListener("click", (e) => {
  if (dragMoved) return; // click that ended a drag
  const b = e.target.closest(".seat");
  if (b) inspect(b.dataset.id);
});
viewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  const r = viewport.getBoundingClientRect();
  zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
}, { passive: false });

let drag = null, dragMoved = false;
viewport.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  drag = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
  dragMoved = false;
});
window.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (!dragMoved && Math.hypot(dx, dy) < 5) return;
  dragMoved = true;
  viewport.classList.add("dragging");
  view.x = drag.ox + dx; view.y = drag.oy + dy;
  apply();
});
window.addEventListener("pointerup", () => {
  drag = null;
  viewport.classList.remove("dragging");
  setTimeout(() => { dragMoved = false; }, 0); 
});
