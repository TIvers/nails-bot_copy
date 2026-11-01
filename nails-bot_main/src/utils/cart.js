// Обновленная функция чтения куки с декодированием
const getCookie = (name) => {
  const cookies = `; ${document.cookie}`;
  const parts = cookies.split(`; ${name}=`);
  if (parts.length === 2) {
    const encodedValue = parts.pop().split(";").shift();
    return decodeURIComponent(encodedValue); // Декодируем значение
  }
};

const getCookieKeys = () => {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter((key) => key.startsWith("cart_"));
};

export function getAllCart() {
  const uniqueItems = new Map();

  // 1. Обрабатываем куки (с приоритетом)
  getCookieKeys().forEach((cookieKey) => {
    try {
      const cookieValue = getCookie(cookieKey);
      if (!cookieValue) return;

      const item = JSON.parse(cookieValue); // Теперь получим валидный JSON
      if (item?.id && !uniqueItems.has(item.id)) {
        uniqueItems.set(item.id, item);
      }
    } catch (e) {
      console.error(`Invalid JSON in ${cookieKey}`, e);
    }
  });

  // 2. Локальное хранилище (без изменений)
  Object.keys(localStorage)
    .filter((key) => key.startsWith("cart_"))
    .forEach((key) => {
      const itemId = key.split("_")[1];
      if (!uniqueItems.has(itemId)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item?.id) uniqueItems.set(item.id, item);
        } catch (e) {
          console.error(`Invalid JSON in ${key}`, e);
        }
      }
    });

  // 3. Сессионное хранилище (без изменений)
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith("cart_"))
    .forEach((key) => {
      const itemId = key.split("_")[1];
      if (!uniqueItems.has(itemId)) {
        try {
          const item = JSON.parse(sessionStorage.getItem(key));
          if (item?.id) uniqueItems.set(item.id, item);
        } catch (e) {
          console.error(`Invalid JSON in ${key}`, e);
        }
      }
    });

  return Array.from(uniqueItems.values());
}
