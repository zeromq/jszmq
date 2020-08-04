// Material UI colors
export const flatColors = {
  // Reds
  alizarin: '#E74C3C',
  pomegranate: '#C0392B',

  // Oranges
  orange: '#F39C12',
  carrot: '#E67E22',
  pumpkin: '#D35400',

  // Yellows
  sunflower: '#F1C40F',

  // Greens
  turquoise: '#1ABC9C',
  greenSea: '#16A085',
  emerald: '#2ECC71',
  nephritis: '#27AE60',

  // Blues
  peterRiver: '#3498DB',
  belizeHole: '#2980B9',
  wetAsphalt: '#34495E',
  midnightBlue: '#2C3E50',

  // Purples
  amethyst: '#9B59B6',
  wisteria: '#8E44AD',

  // Grays
  clouds: '#ECF0F1',
  silver: '#BDC3C7',
  concrete: '#95A5A6',
  asbestos: '#7F8C8D',
}

const textColor = (color: string) => ({ color })

export const textColors = {
  red1: textColor(flatColors.alizarin),
  red2: textColor(flatColors.pomegranate),
  orange1: textColor(flatColors.orange),
  orange2: textColor(flatColors.carrot),
  orange3: textColor(flatColors.pumpkin),
  yellow1: textColor(flatColors.sunflower),
  green1: textColor(flatColors.turquoise),
  green2: textColor(flatColors.greenSea),
  green3: textColor(flatColors.emerald),
  green4: textColor(flatColors.nephritis),
  blue1: textColor(flatColors.peterRiver),
  blue2: textColor(flatColors.belizeHole),
  blue3: textColor(flatColors.wetAsphalt),
  blue4: textColor(flatColors.midnightBlue),
  purple1: textColor(flatColors.amethyst),
  purple2: textColor(flatColors.wisteria),
  gray1: textColor(flatColors.clouds),
  gray2: textColor(flatColors.silver),
  gray3: textColor(flatColors.concrete),
  gray4: textColor(flatColors.asbestos),
}
