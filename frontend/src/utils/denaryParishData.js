// Deanery (denary) -> parishes mapping extracted from my_App build
export const denaryParishMap = {
  bali: [
    'St. Oliver Maihula',
    'St. Paul Bali',
    'St. Mary Jatau'
  ],
  kofai: [
    'St. Peter Nukkai',
    'Holy Family Kofai',
    'St Athanasius Iware',
    'St. John the Baptist Janebanbu',
    'St. Thomas Aquinas Chaplaincy',
    'St. Gabriel Sunkani',
    'St.Peter chaplaincy Jauro Yino'
  ],
  jalingo: [
    'St. Joseph Mayo-gwoi',
    'Holy Trinity Nyabunkaka',
    'St. Paul Sabongari',
    'St. Paul Tutunwada',
    'St. Augustine Jalingo',
    'St. Theresa NTA'
  ],
  zing: [
    'St. Thomas',
    'St. Patrick Tudun wada',
    'St. Stephen Bitako Yali Pastoral',
    'St. Mary Bitako Mazara pastoral',
    'St. Andrew Gampubong Pastoral'
  ],
  kpantisawa: [
    'St. John Parish Kpantisawa',
    'St. Peter Pupule',
    'St. Theresa Mika pastoral',
    'St. Thesesa of the child Jesus'
  ],
  yakoko: [
    "St. Monica's yakoko",
    'All Saints Lamma',
    'St. Peter Monkin'
  ],
  olqp: [
    'St Patrick kpanti Napoo',
    'Our lady queen of peace cathedral',
    'St Ann negatavah',
    'Pastoral Area',
    'St Peter Abuja phase 1',
    'St Justina mayo Dassa',
    'St John Paul de second gulom',
    'Church of Assumption Kona'
  ],
  mutumbiyu: [
    'St John Mutum-biyu',
    'St Paul Tella',
    'St Parick Sabongida',
    'St Monica Namnail',
    'St Denis Pena',
    'St Mathew Dan'
  ],
  karimlamido: [
    'St Joseph Lau',
    'Holy Family Karim Lamido',
    'St Patrick Jen Pastoral area',
    'St Theresa Kunini',
    'St John Bosko Chaplaincy Jimlari'
  ]
};

export const denaryList = Object.keys(denaryParishMap);

export const getParishesForDenary = (denaryKey) => denaryParishMap[denaryKey] || [];
