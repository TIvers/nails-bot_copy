export const useSortedOrdersUser = (arr) => {
  const sortedOrders = arr
    .map((order) => {
      // Преобразуем строку products в JSON массив
      if (typeof order.products === "string") {
        try {
          order.products = JSON.parse(order.products.replace(/'/g, '"'));
        } catch (e) {
          console.error("Ошибка при парсинге products:", e);
          order.products = [];
        }
      }

      return order;
    })
    .sort((a, b) => {
      // Адаптируем для формата времени "2025-04-27 17:16:11.103915"
      const dateTimeA = new Date(a.time);
      const dateTimeB = new Date(b.time);

      return dateTimeB.getTime() - dateTimeA.getTime();
    });

  return sortedOrders;
};
