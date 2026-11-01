// API.js - Enhanced version
export const baseURL = "https://nails.nilit2.ru:8000/";

export const API = {
  // Existing methods
  getUser: async (id_tg, username) => {
    const option = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_tg, username }),
    };

    return fetch(`${baseURL}get_user.php`, option)
      .then((res) => res.json())
      .catch((err) => {
        console.error("API request error:", err);
        return { success: false };
      });
  },
  checkItem: async (id) => {
    const option = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_product: id }),
    };

    return fetch(`${baseURL}check_item.php`, option)
      .then((res) => res.json())
      .catch((err) => {
        console.error("API request error:", err);
        return { success: false };
      });
  },
  // Helper function to parse JSON response that might contain multiple JSON objects
  parseResponseTwo: async (response) => {
    const responseText = await response.text();

    try {
      // Попытка разобрать весь ответ как JSON
      return JSON.parse(responseText);
    } catch (parseError) {
      console.log(
        "Не удалось разобрать весь ответ как JSON. Попытка извлечения объектов..."
      );

      try {
        // Найти все возможные JSON объекты в строке с помощью регулярного выражения
        const jsonObjects = [];
        const regex = /(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g;
        let match;

        while ((match = regex.exec(responseText)) !== null) {
          try {
            const jsonObj = JSON.parse(match[0]);
            jsonObjects.push(jsonObj);
          } catch (e) {
            console.log("Не удалось разобрать найденный объект:", match[0]);
          }
        }

        // Возвращаем второй объект, если он есть
        if (jsonObjects.length >= 2) {
          return jsonObjects[1];
        } else if (jsonObjects.length === 1) {
          return jsonObjects[0];
        } else {
          return null;
        }
      } catch (e) {
        console.error("Ошибка при разборе ответа:", e);
        return null;
      }
    }
  },
  parseResponse: async (response) => {
    const responseText = await response.text();

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      // If single JSON parse fails, try splitting multiple JSON objects
      const jsonParts = responseText.split("}{");

      if (jsonParts.length > 1) {
        // Fix the split objects by adding the missing braces
        const dataJson = jsonParts[0] + "}" + "{" + jsonParts[1];

        try {
          return JSON.parse(dataJson);
        } catch (e) {
          // If that fails, try just the second part
          const secondPart = "{" + jsonParts[1];
          return JSON.parse(secondPart);
        }
      } else {
        try {
          // Try to parse as is first
          return JSON.parse(jsonParts[0]);
        } catch (e) {
          // If that fails, try to clean the JSON string
          try {
            // Find where the first valid JSON object ends
            const match = jsonParts[0].match(/^\s*(\{.*?\}|\[.*?\])\s*/);
            if (match) {
              console.log("Extracted valid JSON part:", match);
              return JSON.parse(match[1]);
            }

            return null;
          } catch (e2) {
            console.error("Failed to parse JSON:", e2);
            return null;
          }
        }
      }
      // console.error("Unable to parse response data:", responseText);
      // throw new Error("Unable to parse response data");
    }
  },

  // Get all categories
  getCategories: async () => {
    const option = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "category",
        id: "NULL",
      }),
    };

    try {
      const resp = await fetch(`${baseURL}catalog.php`, option);

      return API.parseResponse(resp);
    } catch (err) {
      console.error("API request error:", err);
      return { data: [] };
    }
  },

  // Get single product by id
  getProduct: async (productId) => {
    const option = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "item",
        id: productId,
      }),
    };

    try {
      const resp = await fetch(`${baseURL}catalog.php`, option);
      return API.parseResponse(resp);
    } catch (err) {
      // console.error("API request error:", err);
      return { success: false };
    }
  },
  fetchSearch: async (value) => {
    const option = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "product_list",
        search: value,
      }),
    };

    try {
      const resp = await fetch(`${baseURL}search.php`, option);
      return API.parseResponse(resp);
    } catch (err) {
      // console.error("API request error:", err);
      return { success: false };
    }
  },
  getProducts: async (sectionId) => {
    const option = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "category",
        id: sectionId,
      }),
    };

    try {
      const resp = await fetch(`${baseURL}catalog.php`, option);
      return API.parseResponse(resp);
    } catch (err) {
      // console.error("API request error:", err);
      return { success: false };
    }
  },
  // Получение заказов пользователя
  getOrders: async (userId) => {
    const option = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    return fetch(`${baseURL}get_orders.php?user_id=${userId}`, option)
      .then((res) => res.json())
      .catch((err) => {
        console.error("API request error:", err);
        return [];
      });
  },
};

// Recursive function to fetch subcategories and products
async function transformCatalogWithProducts(catalogData) {
  async function processNode(node) {
    const newNode = { ...node };

    // Определяем, нужно ли загружать товары для этого узла
    const shouldFetchProducts = !newNode.children?.length || newNode.level >= 3;

    if (shouldFetchProducts) {
      try {
        // Получаем список товаров для текущего раздела
        const productsResponse = await API.getProducts(newNode.id_section);
        const productList = Array.isArray(productsResponse)
          ? productsResponse
          : productsResponse?.data || [];
        if (!productList) return;
        // Загружаем детальную информацию для каждого товара
        const productsWithDetails = await Promise.all(
          productList.map(async (product) => {
            try {
              console.log(product.id);
              return await API.getProduct(product.id);
            } catch (error) {
              console.error(`Error fetching product ${product.id}:`, error);
              return null;
            }
          })
        );

        // Заменяем детей на товары (фильтруем неудачные запросы)
        newNode.children = productsWithDetails.filter((p) => p !== null);
      } catch (error) {
        console.error(
          `Error fetching products for section ${newNode.id_section}:`,
          error
        );
        newNode.children = [];
      }
    } else if (newNode.children?.length) {
      // Обрабатываем дочерние категории
      newNode.children = await Promise.all(
        newNode.children.map((child) => processNode(child))
      );
    }

    return newNode;
  }

  return Array.isArray(catalogData)
    ? await Promise.all(catalogData.map(processNode))
    : await processNode(catalogData);
}

export async function getAllProducts(catalogData) {
  try {
    // Проверка входных данных
    if (!catalogData || !Array.isArray(catalogData)) {
      throw new Error("Invalid catalog data");
    }

    // Добавьте логирование для отладки
    console.log("Processing categories:", catalogData.length);
    const transformed = await transformCatalogWithProducts(catalogData);
    console.log("Transformed data:", transformed);
    return transformed;
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    return []; // Возвращаем fallback-значение
  }
}
