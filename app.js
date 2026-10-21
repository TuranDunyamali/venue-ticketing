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
