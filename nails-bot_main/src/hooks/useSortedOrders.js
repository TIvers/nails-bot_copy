import React from "react";

export const useSortedOrders = (data) => {
  const sortedOrders = React.useMemo(() => {
    // Преобразуем и выравниваем данные
    const flattenedOrders = Array.isArray(data) ? data : [data];

    return flattenedOrders
      .map((order) => {
        // Преобразуем строку products в JSON массив
        try {
          // Преобразуем одинарные кавычки в двойные для корректного JSON.parse
          if (typeof order.products === "string") {
            order.products = JSON.parse(order.products.replace(/'/g, '"'));
          }
        } catch (error) {
          console.error("Ошибка при парсинге products:", error);
          order.products = [];
        }

        // Извлекаем дату из ISO строки
        const orderDate = new Date(order.time);

        return {
          ...order,
          orderDate,
          // Добавляем отформатированную дату для группировки
          formattedDate: `${orderDate.getMonth() + 1}.${orderDate
            .getFullYear()
            .toString()
            .substr(2)}`,
        };
      })
      .sort((a, b) => b.orderDate - a.orderDate); // Сортировка по дате (новые сначала)
  }, [data]);

  // Группируем заказы по месяцу и году
  const groupedOrders = React.useMemo(() => {
    return sortedOrders.reduce((acc, order) => {
      const key = order.formattedDate;

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(order);
      return acc;
    }, {});
  }, [sortedOrders]);

  // Преобразуем сгруппированные данные в массив для удобного использования
  const result = React.useMemo(() => {
    return Object.entries(groupedOrders)
      .map(([key, orders]) => ({
        monthYear: key,
        orders: orders,
      }))
      .sort((a, b) => {
        const [monthA, yearA] = a.monthYear.split(".");
        const [monthB, yearB] = b.monthYear.split(".");

        // Сравниваем сначала годы
        if (yearA !== yearB) {
          return yearB - yearA;
        }
        // Если годы одинаковые, сравниваем месяцы
        return monthB - monthA;
      });
  }, [groupedOrders]);

  return result;
};
