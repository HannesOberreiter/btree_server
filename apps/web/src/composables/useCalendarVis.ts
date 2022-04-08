import { useDateFormat } from './useDate';

interface fetchInfo {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
  timeZone: string;
}

const useCalendarVis = () => {
  const useDate = useDateFormat();
  const render = (info: fetchInfo) => {
    const start = useDate.toDayjs(info.start);
    const end = useDate.toDayjs(info.end);
    const year = start.year();
    const visDates = [
      {
        date: useDate.toDayjs(`${year}-04-30`),
        title: '(VIS) Stichtag, Frühjahr',
        text: 'Stichtag Zählung',
      },
      {
        date: useDate.toDayjs(`${year}-06-30`),
        title: '(VIS) Meldedatum, Frühjahr',
        text: 'Letzte Meldedatum',
      },
      {
        date: useDate.toDayjs(`${year}-10-31`),
        title: '(VIS) Stichtag, Herbst',
        text: 'Stichtag Zählung',
      },
      {
        date: useDate.toDayjs(`${year}-12-31`),
        title: '(VIS) Meldedatum, Herbst',
        text: 'Letzte Meldedatum',
      },
    ];
    const result = visDates.map((value) => {
      const res: any = [];
      if (value.date >= start && value.date <= end) {
        res.start = useDate.isoFormat(value.date.toISOString());
        res.fullday = true;
        res.title = value.title;
        res.editable = false;
        res.color = 'red';
        res.textColor = 'white';
        res.icon = 'fas fa-bookmark';
        res.info = visDates;
        res.table = 'vis';
      }
      return res;
    });
    return result;
  };

  return { render };
};

export default useCalendarVis;
