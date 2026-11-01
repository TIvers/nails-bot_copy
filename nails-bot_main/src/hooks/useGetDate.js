const month = {
  1: "Январь",
  2: "Февраль",
  3: "Март",
  4: "Апрель",
  5: "Май",
  6: "Июнь",
  7: "Июль",
  8: "Август",
  9: "Сентябрь",
  10: "Октябрь",
  11: "Ноябрь",
  12: "Декабрь",
};
export const useGetDate = (date) => {
  console.log("date", date);
  const dateArr = date.split(".");
  if (dateArr.length > 2) dateArr.slice(1, 3);
  const getMonth = month[dateArr[0]];
  const year = `20${dateArr[1]}`;
  return {
    getMonth,
    year,
  };
};
