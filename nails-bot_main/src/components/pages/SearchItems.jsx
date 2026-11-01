"use client";

import { useEffect, useState, useCallback } from "react";
import SearchInput from "../shared/SearchInput";
import { Product } from "../shared";
import { Link } from "react-router-dom";
import { API } from "../../api";
import SkeletonLoader from "../ui/SkeletonLoader";

// Skeleton loader component for multiple items

export default function SearchItems() {
  const [value, setValue] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingProducts, setPendingProducts] = useState([]);

  const handleSearch = ({ target: { value } }) => {
    setValue(value);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
  };

  useEffect(() => {
    let abortController = new AbortController();
    let timeoutId;

    const fetchData = async () => {
      if (!value.trim()) {
        setList([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Получаем секции с проверкой ответа
        const sectionsResponse = await API.fetchSearch(value.toLowerCase(), {
          signal: abortController.signal,
        });
        // 2. Проверка структуры ответа
        if (!sectionsResponse?.data?.data) {
          throw new Error("Invalid sections response structure");
        }
        const limitData = sectionsResponse.data.data.slice(0, 60);
        console.log("sectionsResponse", sectionsResponse.data.data);
        setList(limitData);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Ошибка при загрузке данных");
          console.error("Search error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    timeoutId = setTimeout(fetchData, 300);

    return () => {
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [value]);

  return (
    <div>
      <SearchInput
        handleSubmit={handleSubmit}
        value={value}
        handleSearch={handleSearch}
      />

      <div className="mt-[100px]">
        {loading ? (
          <div className="justify-self-center grid grid-cols-2 gap-[10px_10px]  ">
            <SkeletonLoader count={10} />
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : list.length > 0 ? (
          <div className="justify-self-center grid grid-cols-2 gap-[10px_10px] ">
            {list.map((item, i) => {
              // Check before rendering
              if (!item?.id) return null;
              return (
                <div key={i} className=" ">
                  <Product className={""} search={true} idItem={item.id} />
                </div>
              );
            })}

            {pendingProducts.length > 0 && (
              <div className="w-full text-center py-2">
                <p className="text-sm text-gray-500">Загружаем еще товары...</p>
              </div>
            )}
          </div>
        ) : value ? (
          <div className="h-[70vh] flex flex-col justify-center items-center">
            <p className="font-montserrat">
              По вашему запросу ничего не найдено
            </p>
            <div className="h-[200px] w-[200px]">
              <img src="/img/nofaund.png" alt="Not found" />
            </div>
          </div>
        ) : (
          <div className="text-center text-gray_dark">
            Введите запрос для поиска
          </div>
        )}
      </div>
    </div>
  );
}
