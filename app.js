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
