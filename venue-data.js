const VENUE = {
  name: "Grand Aurora Theatre",
  width: 1370,
  height: 960,
  seatSize: 26,
  seatGap: 4,
  stage: { x: 335, y: 20, w: 700, h: 90, label: "STAGE" },

  categories: {
    vip:      { name: "VIP",      price: 120, color: "#b8860b" },
    premium:  { name: "Premium",  price: 90,  color: "#7b3fa0" },
    standard: { name: "Standard", price: 65,  color: "#1f6fb2" },
    economy:  { name: "Economy",  price: 35,  color: "#2e8b57" }
  },

  sections: [
    { id: "VIP", name: "VIP Front",         category: "vip",      x: 505, y: 150, rows: 3, seatsPerRow: 12, firstRow: "A", blocked: ["A5", "A6"] },
    { id: "OL",  name: "Orchestra Left",    category: "standard", x: 150, y: 270, rows: 8, seatsPerRow: 8,  firstRow: "D" },
    { id: "OC",  name: "Orchestra Center",  category: "premium",  x: 445, y: 270, rows: 8, seatsPerRow: 16, firstRow: "D" },
    { id: "OR",  name: "Orchestra Right",   category: "standard", x: 980, y: 270, rows: 8, seatsPerRow: 8,  firstRow: "D" },
    { id: "MZ",  name: "Mezzanine",         category: "standard", x: 235, y: 575, rows: 5, seatsPerRow: 30, firstRow: "L" },
    { id: "BA",  name: "Balcony",           category: "economy",  x: 145, y: 775, rows: 5, seatsPerRow: 36, firstRow: "Q" }
  ],

  soldRatio: 0.12, // share of seats pseudo-randomly marked unavailable (deterministic)

  labels: [
    { text: "ENTRANCE", x: 20,   y: 560, w: 100 },
    { text: "ENTRANCE", x: 1250, y: 560, w: 100 }
  ]
};

