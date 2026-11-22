import { DEFAULT_PLAN_SETTINGS, EMPTY_BRIEF, EMPTY_PROGRAMME, type FlightOffer, type ItineraryOption, type PlanBrief, type PlanPlace, type PlanSession, type StayOption } from "@/lib/planner/types";

/**
 * Demo data for the film: a long weekend in Lisbon for 20 people. Everything on screen is
 * computed from this by the app's own code (rankings, picks, the price per person).
 */

const place = (placeId: string, name: string, rating: number, ratingCount: number): PlanPlace => ({
  placeId,
  name,
  address: "Lisbon",
  rating,
  ratingCount,
  priceLevel: null as unknown as PlanPlace["priceLevel"],
  mapsUrl: "https://maps.google.com",
  website: "",
  phone: "",
  lat: null,
  lng: null,
  types: [],
  openingPeriods: null,
  servesVegetarian: null,
  fetchedAt: "2026-11-14T10:00:00.000Z",
} as PlanPlace);

const BRIEF: PlanBrief = {
  ...EMPTY_BRIEF,
  destination: "Lisbon",
  dateFrom: "2027-03-05",
  dateTo: "2027-03-08",
  nights: 3,
  travellersApprox: 20,
  budgetPerPerson: 65_000,
  currency: "GBP",
  departureAirports: ["LHR", "LGW"],
  tripType: "City break",
};

const flight = (id: string, airline: string, origin: string, numbers: [string, string], out: [string, string], back: [string, string], price: number, stops = 0, durationMin = 165): FlightOffer => ({
  id,
  airline,
  flightNumbers: [numbers[0]],
  origin,
  destination: "LIS",
  departAt: `2027-03-05T${out[0]}`,
  arriveAt: `2027-03-05T${out[1]}`,
  durationMin,
  stops,
  returnFlightNumbers: [numbers[1]],
  returnDepartAt: `2027-03-08T${back[0]}`,
  returnArriveAt: `2027-03-08T${back[1]}`,
  pricePerPerson: price,
  baggage: "Cabin bag",
  deepLink: "https://www.google.com/travel/flights",
  fetchedAt: "2026-11-14T10:00:00.000Z",
  source: "search",
  estimate: true,
});

export const FLIGHTS: FlightOffer[] = [
  flight("f-ba", "British Airways", "LHR", ["BA 500", "BA 501"], ["08:10", "10:55"], ["17:35", "20:20"], 18_900),
  flight("f-tap", "TAP Air Portugal", "LGW", ["TP 1331", "TP 1336"], ["06:05", "08:50"], ["21:10", "23:55"], 15_400),
  flight("f-ezy", "easyJet", "LGW", ["U2 8721", "U2 8722"], ["05:45", "11:40"], ["13:15", "18:30"], 11_900, 1, 295),
];

const stay = (id: string, title: string, kind: "hotel" | "rental", rating: number, reviews: number, perNight: number, unit: "room" | "apartment", sleeps: number, notes: string[] = []): StayOption => ({
  id,
  title,
  pitch: "",
  basis: "hotels",
  kind,
  notes,
  place: place(`p-${id}`, title, rating, reviews),
  price: { total: perNight * 3, perNight, nights: 3, unit, sleeps, currency: "GBP", link: "https://www.google.com/travel/hotels", fetchedAt: "2026-11-14T10:00:00.000Z" },
});

export const STAYS: StayOption[] = [
  stay("s-memmo", "Memmo Alfama", "hotel", 4.7, 3_812, 26_000, "room", 2, ["Rooftop pool and terrace"]),
  stay("s-ribeira", "Ribeira Riverside Flats", "rental", 4.8, 1_204, 32_000, "apartment", 6, ["Whole flats by the river, 4 min from the tram"]),
  stay("s-baixa", "Hotel Baixa Square", "hotel", 4.6, 2_410, 19_000, "room", 2),
];

const day = (title: string, highlights: string[]) => ({ title, highlights });

export const ITINERARIES: ItineraryOption[] = [
  {
    id: "i-classic",
    title: "Classic Lisbon",
    pitch: "Trams, viewpoints and a fado night in Alfama, with a free afternoon for the beach.",
    pace: "balanced",
    basis: "places",
    days: [
      day("Arrival", ["Transfer to the old town", "Sunset at Miradouro da Graça", "Group dinner in Alfama"]),
      day("Old Lisbon", ["Tram 28", "Castelo de São Jorge", "Fado night"]),
      day("Belém and the river", ["Pastéis de Belém", "Jerónimos Monastery", "Free evening"]),
      day("Departure", ["Brunch at Time Out Market", "Transfer to the airport"]),
    ],
  },
  {
    id: "i-coast",
    title: "Sintra and the coast",
    pitch: "A day trip to Sintra's palaces and the cliffs at Cabo da Roca, then surf in Cascais.",
    pace: "packed",
    basis: "places",
    days: [
      day("Arrival", ["Transfer", "Bairro Alto"]),
      day("Sintra", ["Pena Palace", "Cabo da Roca"]),
      day("Cascais", ["Surf lesson", "Seafood lunch"]),
      day("Departure", ["Transfer"]),
    ],
  },
  {
    id: "i-slow",
    title: "Slow Lisbon",
    pitch: "Long lunches, a sunset boat on the Tagus and plenty of time to wander.",
    pace: "relaxed",
    basis: "places",
    days: [
      day("Arrival", ["Transfer", "Wine bar"]),
      day("The river", ["Sunset boat"]),
      day("Wander", ["LX Factory"]),
      day("Departure", ["Transfer"]),
    ],
  },
];

const base = (brief: PlanBrief): PlanSession => ({
  id: "demo",
  clubId: "default",
  createdBy: "Demo",
  title: "",
  status: "intake",
  brief,
  settings: DEFAULT_PLAN_SETTINGS,
  messages: [],
  outline: { days: [] },
  costLines: [],
  quoteSuggestions: [],
  flightOffers: [],
  placeCache: {},
  guided: { questions: [], answers: {} },
  createdAt: "2026-11-14T10:00:00.000Z",
  updatedAt: "2026-11-14T10:00:00.000Z",
});

/** The first question: where the trip goes. */
export const DESTINATION_STEP = base({ ...EMPTY_BRIEF, currency: "GBP" });

/** The third question: how many people. */
export const TRAVELLERS_STEP = base({ ...EMPTY_BRIEF, currency: "GBP", destination: "Lisbon", dateFrom: BRIEF.dateFrom, dateTo: BRIEF.dateTo, nights: 3 });

/** "Pick what fits", with the given stay chosen (undefined = the app's own proposal). */
export function pickStep(stayId?: string): PlanSession {
  return {
    ...base(BRIEF),
    status: "drafting",
    flightOffers: FLIGHTS,
    flightSearch: { origins: ["LHR", "LGW"], destinations: ["LIS"], dateOut: BRIEF.dateFrom, dateBack: BRIEF.dateTo, passengers: 9, travellers: 20, provider: "Google Flights", searchedAt: "2026-11-14T10:00:00.000Z" } as PlanSession["flightSearch"],
    guided: {
      questions: [],
      answers: {},
      research: { stays: STAYS, itineraries: ITINERARIES, notes: [], researchedAt: "2026-11-14T10:00:00.000Z" },
      picked: { programme: EMPTY_PROGRAMME, itineraryId: "i-classic", ...(stayId ? { stayId } : {}) },
    },
  };
}

export const PICK_BEFORE = "s-memmo";
export const PICK_AFTER = "s-ribeira";
