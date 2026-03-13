"""
Ken je Kamerlid – Foto URL Fetcher
Draai dit script in Claude Code (of lokaal) om foto-URLs op te halen
uit de officiële Tweede Kamer Open Data API.
Resultaat: kamerleden_fotos.csv met kolommen: naam, foto_url
"""
import urllib.request
import urllib.parse
import json
import csv
import time

PLACEHOLDER = "https://www.tweedekamer.nl/sites/default/files/styles/kamerlid_portret/public/2022-11/Tweede-Kamer-Logo.jpg"
BASE_URL = "https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0"

KAMERLEDEN = [
    "Alexander Kops", "Alisha Müller", "André Flach", "André Poortman", "Ani Zalinyan",
    "Annabel Nanninga", "Anne-Marijke Podt", "Annelotte Lammers", "Annette Raijer",
    "Anouschka Biekman", "Arend Kisteman", "Barbara Kathmann", "Bart Bikkers",
    "Bente Becker", "Björn Schutz", "Caroline van der Plas", "Chris Jansen",
    "Chris Stoffer", "Christine Teunissen", "Claire Martens-America", "Corrie van Brenk",
    "Daan de Kort", "Daniël van den Berg", "Diederik Boomsma", "Diederik van Dijk",
    "Dion Graus", "Dion Huidekooper", "Don Ceder", "Doğukan Ergin", "Edgar Mulder",
    "Elles van Ark", "Elmar Vlottes", "Emiel van Dijk", "Erik van der Maas",
    "Erwin Prickaertz", "Esmah Lahlah", "Esther Ouwehand", "Etkin Armut",
    "Eveline Tijmstra", "Fatihya Abdi", "Fatimazhra Belhirch", "Felix Klos",
    "Femke Wiersma", "Frederik Jansen", "Geert Wilders", "Gideon van Meijeren",
    "Gidi Markuszower", "Habtamu de Hoop", "Hanneke Steen", "Hanneke van der Werf",
    "Harmen Krul", "Harry Bevers", "Heera Dijk", "Henk Jumelet", "Henk Vermeer",
    "Henk-Jan Osterhaus", "Henri Bontenbal", "Hidde Heutink", "Hilde Wendel",
    "Ilana Rooderkerk", "Ines Kostić", "Inge van Dijk", "Ingrid Coenradie",
    "Ingrid Michon-Derkzen", "Ismail el Abassi", "Jan Arie Koorevaar", "Jan Paternotte",
    "Jan Schoonis", "Jan Struijs", "Jantine Zwinkels", "Jeltje Straatman",
    "Jeremy Mooiman", "Jesse Klaver", "Jimmy Dijk", "Joost Eerdmans",
    "Joost Sneller", "Joris Lohman", "Judith Bühler", "Julian Bushoff",
    "Jurgen Nobel", "Kati Piri", "Laura Bromet", "Laurens Dassen",
    "Lidewij de Vos", "Lisa Vliegenhart", "Lisa Westerveld", "Luc Stultiens",
    "Luciënne Boelsma-Hoekstra", "Maarten Goudzwaard", "Maes van Lanschot",
    "Mahjoub Mathlouti", "Maikel Boon", "Marc Vervuurt", "Marieke Vellinga-Beemsterboer",
    "Marijke Synhaeve", "Marina Vondeling", "Mariëtte Patijn", "Marjolein Faber",
    "Marjolein Moorman", "Martin Bosma", "Martin de Beer", "Michelle Jagtenberg",
    "Michiel Hoogeveen", "Mikal Tseggai", "Mirjam Bikker", "Mohammed Mohandis",
    "Mona Keijzer", "Mpanzu Bamenga", "Nicole Maes", "Nicole Moinat",
    "Ouafa Oualhajd", "Pepijn van Houwelingen", "Peter de Groot", "Peter van Duijvendoorde",
    "Pieter Grinwis", "Queeny Rajkowski", "Rachel van Meetelen", "Ralf Dekker",
    "Ranjith Clemminck", "Raymond de Roon", "Renate den Hollander", "Renilde Huizenga",
    "René Claassen", "Robert van Asten", "Robin van Leijen", "Ruben Brekelmans",
    "Sandra Beckerman", "Sarah Dobbe", "Sarah El Boujdaini", "Sarath Hamstra",
    "Sebastiaan Stöteler", "Shanna Schilder", "Simon Ceulemans", "Sjoukje van Oosterhout",
    "Songül Mutluer", "Stephan Neijenhuiis", "Stephan van Baarle", "Suzanne Kröger",
    "Tamara ten Hove", "Thom van Campen", "Tijs van den Brink", "Tom Russcher",
    "Tom van der Lee", "Tony van Dijck", "Ulaş Köse", "Ulysse Ellian",
    "Vicky Maeijer", "Wendy van Eijk", "Wieke Paulusma", "Wim Meulenkamp"
]


def parse_naam(volledige_naam):
    """Splits naam in voornaam en achternaam (simpel)."""
    delen = volledige_naam.strip().split(" ")
    voornaam = delen[0]
    achternaam = " ".join(delen[1:]) if len(delen) > 1 else ""
    return voornaam, achternaam


def fetch_persoon_id(voornaam, achternaam):
    """Zoek de Persoon-ID op via de OData API."""
    # Escape apostrofs voor OData
    achternaam_escaped = achternaam.replace("'", "''")
    voornaam_escaped = voornaam.replace("'", "''")
    params = urllib.parse.urlencode({
        "$filter": f"Achternaam eq '{achternaam_escaped}' and Verwijderd eq false",
        "$select": "Id,Roepnaam,Tussenvoegsel,Achternaam,HasResource",
        "$top": "5",
    })
    url = f"{BASE_URL}/Persoon?{params}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            personen = data.get("value", [])
            # Filter op voornaam als er meerdere zijn
            if len(personen) > 1:
                personen = [p for p in personen if
                            (p.get("Roepnaam") or "").lower() == voornaam.lower()]
            if personen:
                persoon = personen[0]
                return persoon["Id"], persoon.get("HasResource", False)
    except Exception as e:
        print(f"  Fout bij ophalen {voornaam} {achternaam}: {e}")
    return None, False


def get_foto_url(persoon_id, has_resource):
    if persoon_id and has_resource:
        return f"{BASE_URL}/Persoon/{persoon_id}/resource"
    elif persoon_id:
        return PLACEHOLDER
    return PLACEHOLDER


def main():
    resultaten = []
    totaal = len(KAMERLEDEN)
    print(f"Ophalen foto-URLs voor {totaal} kamerleden...\n")

    for i, naam in enumerate(KAMERLEDEN, 1):
        voornaam, achternaam = parse_naam(naam)
        print(f"[{i}/{totaal}] {naam}...", end=" ", flush=True)
        persoon_id, has_resource = fetch_persoon_id(voornaam, achternaam)
        foto_url = get_foto_url(persoon_id, has_resource)
        status = "✓ foto" if (persoon_id and has_resource) else (
            "✓ gevonden (geen foto)" if persoon_id else "✗ niet gevonden")
        print(status)
        resultaten.append({
            "naam": naam,
            "persoon_id": persoon_id or "",
            "foto_url": foto_url
        })
        time.sleep(0.1)  # Vriendelijk voor de API

    # Schrijf CSV
    output_file = "kamerleden_fotos.csv"
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["naam", "persoon_id", "foto_url"])
        writer.writeheader()
        writer.writerows(resultaten)

    gevonden = sum(1 for r in resultaten if r["persoon_id"])
    met_foto = sum(1 for r in resultaten if r["foto_url"] != PLACEHOLDER)
    print(f"\nKlaar! {gevonden}/{totaal} personen gevonden, {met_foto} met officiële foto.")
    print(f"Opgeslagen als: {output_file}")


if __name__ == "__main__":
    main()
