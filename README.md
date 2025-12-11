# Blackjack Strategy Advisor

Een slimme Blackjack strategie-assistent voor Premier Blackjack (TOTO) die je de optimale actie adviseert op basis van basic strategy.

## Features

- 🎴 Invoer van dealer kaart en je eigen hand
- 🧠 Basic strategy engine voor Premier Blackjack
- 📱 Mobile-first responsive design
- ⚡ Onmiddellijke aanbevelingen
- 💡 Uitleg bij elke aanbeveling

## Hoe te gebruiken

1. Open `index.html` in je browser
2. Selecteer de dealer's upcard
3. Voer je eigen kaarten in (of totaal + hard/soft)
4. Selecteer welke acties beschikbaar zijn
5. Klik op "Krijg Advies" voor de optimale actie

## Ondersteunde Acties

- **HIT** (Kaart) - Neem nog een kaart
- **STAND** (Blijven) - Stop met kaarten nemen
- **DOUBLE** (Dubbel) - Verdubbel je inzet en neem één kaart
- **SPLIT** - Splits je paar in twee handen
- **SURRENDER** - Geef op en krijg helft van inzet terug

## Technologie

- Vanilla JavaScript (geen dependencies)
- HTML5 & CSS3
- Mobile-first responsive design

## Development

De strategy engine (`js/strategy.js`) bevat alle basic strategy regels in code, geen gekopieerde tabellen. De regels zijn geïmplementeerd volgens Premier Blackjack (TOTO) specificaties.

## Project Structuur

```
├── index.html          # Hoofd HTML bestand
├── css/
│   └── styles.css      # Styling
├── js/
│   ├── strategy.js     # Strategy engine
│   └── app.js          # Applicatie logica
└── README.md           # Deze file
```

## Licentie

MIT License - Vrij te gebruiken voor persoonlijk gebruik.

## Disclaimer

Dit is een educatieve tool. Gebruik op eigen risico. Blackjack bevat altijd een element van geluk en huisvoordeel.
