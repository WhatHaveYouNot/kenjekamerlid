// Volledige kamerleden array uit kamerleden-3.json (met foto_url)
let kamerleden = [];

async function loadData() {
  try {
    const response = await fetch('kamerleden_basis.json');
    kamerleden = await response.json();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

/** Normalise a string into a safe filename segment. */
function toFileName(str) {
  return str
    .toLowerCase()
    .replace(/[áàäâãå]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöôõ]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Return a human-readable duration string from a date string to now. */
function getMembershipDuration(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const years  = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor((diffMs / (30.44 * 24 * 60 * 60 * 1000)) % 12);

  if (years === 0 && months === 0) return "minder dan een maand";
  const parts = [];
  if (years  > 0) parts.push(`${years} jaar`);
  if (months > 0) parts.push(`${months} maand`);
  return parts.join(" en ");
}

/** Return milestone badge data for the given year count, or null. */
function getMilestoneBadge(years) {
  if (years >= 25) return { label: "25 jaar kamerlid", modifier: "--25" };
  if (years >= 15) return { label: "15 jaar kamerlid", modifier: "--15" };
  if (years >= 10) return { label: "10 jaar kamerlid", modifier: "--10" };
  if (years >= 5)  return { label: "5 jaar kamerlid",  modifier: "--5"  };
  if (years >= 1)  return { label: "1 jaar kamerlid",  modifier: ""     };
  return null;
}

/** Build and render the bio section using the DOM API (no innerHTML). */
function renderBio(member) {
  const bioEl = document.getElementById("bio");
  bioEl.innerHTML = "";

  if (!member) return;

  const nameEl = document.createElement("strong");
  nameEl.textContent = member.naam;
  bioEl.appendChild(nameEl);

  const rows = [];

  if (member.type === "kamerlid") {
    if (member.partij) rows.push(["Partij", member.partij]);
  } else if (member.type === "bewindspersoon") {
    if (member.portefeuille) rows.push(["Portefeuille", member.portefeuille]);
  }

  if (member.geboortedatum) {
    const age = Math.floor((Date.now() - new Date(member.geboortedatum).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    rows.push(["Leeftijd", `${age} jaar`]);
  }

  if (member.first_entry_tweede_kamer) {
    const duration = getMembershipDuration(member.first_entry_tweede_kamer);
    rows.push(["In de politiek sinds", `${member.first_entry_tweede_kamer} (${duration})`]);
  }

  rows.push(["Functie", member.huidige_functie]);

  for (const [label, value] of rows) {
    const span = document.createElement("span");
    span.textContent = `${label}: ${value}`;
    bioEl.appendChild(span);
  }

  // No badges for now, since no tenure calculation for badges
}

let lastIndex = -1;

function getRandomIndex() {
  if (kamerleden.length <= 1) return 0;
  let idx;
  do { idx = Math.floor(Math.random() * kamerleden.length); }
  while (idx === lastIndex);
  lastIndex = idx;
  return idx;
}

function showFact(animated = true) {
  // Kies persoon eerst
  const member = kamerleden[getRandomIndex()];

  // Gekste geschenken uit JSON
  const gifts = [
    { kamerlid: "Abassi, I. el (Ismail)", partij: "DENK", datum: "6-12-2025", geschenk: "Ontvangen van La7yati baardolie. De waarde is onbekend", waarom_opvallend: "opvallend persoonlijk verzorgingsproduct" },
    { kamerlid: "Abassi, I. el (Ismail)", partij: "DENK", datum: "18-11-2025", geschenk: "Ontvangen van de “Sport gaat niet vanzelf. Politiek, kom in beweging!” drie ballen ter felicitatie met de nieuwe kamerperiode. De waarde is onbekend.", waarom_opvallend: "absurde letterlijke campagnestunt" },
    { kamerlid: "Brekelmans, R.P. (Ruben)", partij: "VVD", datum: "17-11-2025", geschenk: "Ontvangen van de Gemeente Arnhem een fietspomp. De waarde is onbekend. Geschonken aan derden.", waarom_opvallend: "heel praktisch maar vrij random" },
    { kamerlid: "Plas, C.A.M. van der (Caroline)", partij: "BBB", datum: "1-7-2025", geschenk: "Ontvangen een bordje kippenvleugels, een haring, twee toastjes met ganzenborst, een klein schaaltje kalfsvlees, aardbeien en bessen tijdens evenement NL Voedt in Nieuwspoort, georganiseerd door fruit-, groenten-, vis- en vleessector. De geschatte waarde is €25.", waarom_opvallend: "feitelijk een geregistreerd snackbord" },
    { kamerlid: "Bosma, M. (Martin)", partij: "PVV", datum: "22-5-2025", geschenk: "Ontvangen per post geurkaarsen van de heer Abdullah bin Salim bin Hamad Al Harthi, Sultan van Oman. De waarde is onbekend.", waarom_opvallend: "huiselijk cadeau in politieke context" },
    { kamerlid: "Bikker, M.H. (Mirjam)", partij: "ChristenUnie", datum: "22-1-2025", geschenk: "Ontvangen van de SGP-fractie voor 25 jaar CU een olijfboom. De waarde is onbekend.", waarom_opvallend: "levend cadeau in plaats van standaard boek of bloemen" },
    { kamerlid: "Bamenga, P. (Mpanzu)", partij: "D66", datum: "22-9-2024", geschenk: "Ontvangen van de burgemeester van de gemeente Weert een kaartje voor een voetbalwedstrijd van PSV, een lunch en een vlaai ter waarde van €150,-.", waarom_opvallend: "lunch plus vlaai voelt heerlijk provinciaal" },
    { kamerlid: "Zanten, C.R. van (Claudia)", partij: "BBB", datum: "17-9-2024", geschenk: "Ontvangen van Kappersakademie Rotterdam een Kérastase Chroma Absolu, shampoo 250 ml ter waarde van € 20,95.", waarom_opvallend: "persoonlijk haarproduct als politiek cadeau" },
    { kamerlid: "Baarle, S.R.T. van (Stephan)", partij: "DENK", datum: "18-4-2024", geschenk: "Ontvangen van de gemeente Den Helder een koffiemok en 5 dropjes. De waarde is onbekend.", waarom_opvallend: "extreem specifiek en klein geschenk" },
    { kamerlid: "Campen, A.A.H. van (Thom)", partij: "VVD", datum: "10-1-2024", geschenk: "Ontvangen van de Nederlandse Zuivel Organisatie een kaasschaaf van het merk Boska. De waarde is onbekend.", waarom_opvallend: "klassiek Nederlands maar toch gek als Kamergeschenk" }
  ];
  // Toon gekste geschenk alleen voor kamerleden
  const giftContent = document.getElementById("gift-content");
  if (member.type === "kamerlid") {
    // Zoek geschenk bij kamerlid (match op naam en partij)
    const gift = gifts.find(g => {
      // Match op achternaam en partij
      const naamNorm = member.naam.toLowerCase().split(" ").pop();
      return g.kamerlid.toLowerCase().includes(naamNorm) && g.partij === member.partij;
    });
    if (gift) {
      giftContent.innerHTML = `
        <div class="gift-glass">
          <div class="gift-title">Gekste geschenk</div>
          <div class="gift-desc"><strong>${gift.geschenk}</strong></div>
          <div class="gift-meta">${gift.datum}</div>
        </div>`;
    } else {
      giftContent.innerHTML = '';
    }
  } else {
    giftContent.innerHTML = '';
  }

  const nameEl     = document.getElementById("politician-name");
  const photoEl    = document.getElementById("politician-photo");
  const partyLogoEl = document.getElementById("party-logo");

  // Gebruik foto_url als bron, anders fallback naar lokale jpg
  if (member.foto_url && member.foto_url.trim() !== "") {
    photoEl.src = member.foto_url;
    photoEl.alt = member.naam;
    photoEl.onerror = () => { photoEl.src = "assets/leden/placeholder.svg"; photoEl.onerror = null; };
  } else {
    photoEl.src = `assets/leden/${toFileName(member.naam)}.jpg`;
    photoEl.alt = member.naam;
    photoEl.onerror = () => { photoEl.src = "assets/leden/placeholder.svg"; photoEl.onerror = null; };
  }

  // Party logo: use partij_logo_url if available, else fallback
  if (member.partij_logo_url && member.partij_logo_url.trim() !== "") {
    partyLogoEl.src = member.partij_logo_url;
    partyLogoEl.alt = member.partij || "Partij";
    partyLogoEl.onerror = () => { partyLogoEl.src = "assets/partijen/placeholder.svg"; partyLogoEl.onerror = null; };
  } else {
    partyLogoEl.src = `assets/partijen/${toFileName(member.partij || "placeholder")}.svg`;
    partyLogoEl.alt = member.partij || "Partij";
    partyLogoEl.onerror = () => { partyLogoEl.src = "assets/partijen/placeholder.svg"; partyLogoEl.onerror = null; };
  }

  renderBio(member);

  // Update name
  nameEl.textContent = member.naam;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  document.getElementById("next-btn").addEventListener("click", () => showFact(true));
  showFact(false);
});
