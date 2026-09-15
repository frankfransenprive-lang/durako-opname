export const WAD_PROFILES = [
  {
    id: "veka-softline-82-nl",
    supplier: "Perfect WAD Group",
    name: "VEKA SOFTLINE 82 NL",
    family: "VEKA NL",
    category: "PVC kozijnen / deuren",
    depthMm: 116,
    baseDepthMm: 82,
    chambers: 7,
    glazing: "tot 52 mm",
    note: "Verdiept Nederlands profiel, afgeschuinde lijn"
  },
  {
    id: "veka-softline-82-nl-retro",
    supplier: "Perfect WAD Group",
    name: "VEKA SOFTLINE 82 NL RETRO",
    family: "VEKA NL",
    category: "PVC kozijnen / deuren",
    depthMm: 116,
    baseDepthMm: 82,
    chambers: 7,
    glazing: "tot 52 mm",
    note: "Nederlandse retro / jaren-30 uitstraling"
  },
  {
    id: "veka-softline-82-ad",
    supplier: "Perfect WAD Group",
    name: "VEKA SOFTLINE 82 AD",
    family: "VEKA 82",
    category: "PVC kozijnen / deuren",
    depthMm: 82,
    chambers: 7,
    glazing: "tot 52 mm",
    note: "Moderne vlakke uitvoering"
  },
  {
    id: "veka-82-passive",
    supplier: "Perfect WAD Group",
    name: "Perfect Passive",
    family: "VEKA 82",
    category: "PVC kozijnen / deuren",
    depthMm: 82,
    chambers: 7,
    glazing: "32 / 44 / 52 mm"
  },
  {
    id: "veka-76-balance",
    supplier: "Perfect WAD Group",
    name: "Perfect Balance",
    family: "VEKA 76",
    category: "PVC kozijnen / deuren",
    depthMm: 76,
    chambers: 5,
    glazing: "afhankelijk van uitvoering"
  },
  {
    id: "veka-76-balance-pro",
    supplier: "Perfect WAD Group",
    name: "Perfect Balance Pro",
    family: "VEKA 76",
    category: "PVC kozijnen / deuren",
    depthMm: 76,
    chambers: 5,
    glazing: "afhankelijk van uitvoering"
  },
  {
    id: "veka-70-elegance",
    supplier: "Perfect WAD Group",
    name: "Perfect Elegance",
    family: "VEKA 70",
    category: "PVC kozijnen / deuren",
    depthMm: 70,
    chambers: 5,
    glazing: "afhankelijk van uitvoering"
  },
  {
    id: "whs-72-energy",
    supplier: "Perfect WAD Group",
    name: "Perfect Energy",
    family: "WHS by VEKA 72",
    category: "PVC kozijnen / deuren",
    depthMm: 72,
    chambers: 5,
    glazing: "afhankelijk van uitvoering"
  },
  {
    id: "whs-60-excellent",
    supplier: "Perfect WAD Group",
    name: "Perfect Excellent",
    family: "WHS by VEKA 60",
    category: "PVC kozijnen / deuren",
    depthMm: 60,
    chambers: 4,
    glazing: "afhankelijk van uitvoering"
  },
  {
    id: "ecosol-70",
    supplier: "Perfect WAD Group",
    name: "VEKA ECOSOL 70",
    family: "VEKA ECOSOL",
    category: "PVC schuifsysteem",
    depthMm: 70,
    chambers: 3,
    glazing: "24 mm"
  },
  {
    id: "vekamotion-82",
    supplier: "Perfect WAD Group",
    name: "VEKAMOTION 82",
    family: "VEKAMOTION",
    category: "Hefschuifdeur",
    depthMm: 82,
    chambers: null,
    glazing: "afhankelijk van uitvoering"
  },
  {
    id: "vekamotion-82-max",
    supplier: "Perfect WAD Group",
    name: "VEKAMOTION 82 MAX",
    family: "VEKAMOTION",
    category: "Hefschuifdeur",
    depthMm: 82,
    chambers: null,
    glazing: "afhankelijk van uitvoering"
  }
];

export const ELEMENT_TYPES = [
  { id:"fixed", label:"Vast glas", group:"Kozijn" },
  { id:"turn-left", label:"Draairaam links", group:"Raam" },
  { id:"turn-right", label:"Draairaam rechts", group:"Raam" },
  { id:"tilt", label:"Valraam", group:"Raam" },
  { id:"tilt-turn-left", label:"Draai-kiep links", group:"Raam" },
  { id:"tilt-turn-right", label:"Draai-kiep rechts", group:"Raam" },
  { id:"panel", label:"Paneel", group:"Kozijn" },
  { id:"door-left", label:"Deur linksdraaiend", group:"Deur" },
  { id:"door-right", label:"Deur rechtsdraaiend", group:"Deur" },
  { id:"sliding-left", label:"Schuif links", group:"Schuif" },
  { id:"sliding-right", label:"Schuif rechts", group:"Schuif" }
];

export const ELEMENT_PRESETS = [
  {id:"window-2", label:"2-vaks kozijn", width:2000, height:1500, columns:[1000,1000], rows:[1500], cells:["fixed","tilt-turn-right"]},
  {id:"door-single", label:"Enkele deur", width:1000, height:2150, columns:[1000], rows:[2150], cells:["door-right"]},
  {id:"door-double", label:"Dubbele deur", width:1800, height:2150, columns:[900,900], rows:[2150], cells:["door-left","door-right"]},
  {id:"door-sidelight", label:"Deur + zijlicht", width:1600, height:2150, columns:[1000,600], rows:[2150], cells:["door-right","fixed"]},
  {id:"door-toplight", label:"Deur + bovenlicht", width:1000, height:2500, columns:[1000], rows:[2150,350], cells:["door-right","fixed"]},
  {id:"window-toplight", label:"Kozijn + bovenlicht", width:2000, height:2000, columns:[1000,1000], rows:[1550,450], cells:["fixed","tilt-turn-right","fixed","fixed"]},
  {id:"slider-2", label:"2-delige schuifpui", width:3000, height:2300, columns:[1500,1500], rows:[2300], cells:["fixed","sliding-left"]}
];
