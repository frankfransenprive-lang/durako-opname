# Durako Opname v1

Eerste werkende MVP voor het inmeten van kozijnen, deuren en schuifpuien.

## Wat zit erin?

- Projecten aanmaken
- Klant- en adresgegevens
- Posities K01, K02, enz.
- Totale breedte en hoogte in mm
- Verticale stijlen en horizontale regels via vakindeling
- Losse vakbreedtes en vakhoogtes
- Technische SVG-tekening
- Vast glas
- Draairaam links/rechts
- Draai-kiep links/rechts
- Valraam
- Paneel
- Deur links/rechts met deurklink
- Schuifelement links/rechts
- VEKA / Perfect WAD profielkeuze
- Glas, kleur, ruimte en opmerkingen
- Automatische opslag in de browser via localStorage
- Mobiel / tablet / desktop responsive
- Klaar voor deployment op Railway

## Lokaal starten

```bash
npm install
npm run dev
```

## Railway

Deze repository heeft geen aparte Railway-config nodig.

Railway:
1. New Project
2. Deploy from GitHub repo
3. Kies `durako-opname`
4. Build command: `npm run build`
5. Start command: `npm start`

Railway levert automatisch de `PORT` environment variable.

## GitHub uploaden vanaf iPhone

1. Download en decomprimeer de ZIP in de Bestanden-app.
2. Open de repository `durako-opname` op GitHub.
3. Kies **Add file → Upload files**.
4. Upload de inhoud van deze map. Let op: `package.json` moet in de hoofdmap van de repository staan.
5. Kies **Commit changes**.
6. Railway kan daarna aan deze GitHub repository gekoppeld worden.

## Catalogus aanpassen

De WAD/VEKA-profielen staan in:

`src/data/wadCatalog.js`

Daar kunnen later systemen, deuren, schuifpuien, kleuren, glasopties en artikelgegevens worden uitgebreid zonder de tekenmodule te herschrijven.

## Belangrijk voor v2

Aanbevolen volgende stappen:

- foto's per positie
- PDF opnameblad / werkbon
- echte vrije editor met stijlen/regels slepen
- asymmetrische koppelingen en bovenlichten
- dorpels / onderdorpels
- aanslag / renovatie / nieuwbouw maat
- maatcorrecties en speling
- profiel- en glasregels per WAD-systeem
- cloud database en login voor meerdere medewerkers
- offerte/bestel-export
