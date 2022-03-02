const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Deutsch', value: 'de' },
];
const FORMATS = [
  { label: '13,37 / 05.01.1989', value: 1 },
  { label: '13.37 / 1989-05-01', value: 2 },
];

const SOURCES = [
  {
    label: '-',
    value: 1,
  },
  {
    label: 'Recommended by colleague',
    value: 2,
  },
  {
    label: 'Internet Search',
    value: 3,
  },
  {
    label: 'Social Media',
    value: 4,
  },
  {
    label: 'Advertisement',
    value: 5,
  },
  {
    label: 'Journal/Article',
    value: 6,
  },
  {
    label: 'Mobile App Store',
    value: 7,
  },
  {
    label: 'Other',
    value: 0,
  },
];

const CALENDAR = [
  'rearings',
  'checkups',
  'feeds',
  'treatments',
  'harvests',
  'todos',
  'movedates',
  'vis',
];

export { LANGUAGES, FORMATS, SOURCES, CALENDAR };
