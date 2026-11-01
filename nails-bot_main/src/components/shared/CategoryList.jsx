import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { changeCategoryName } from "../../features/slice/userSlice";
import { API } from "../../api";
import SkeletonLoader from "../ui/SkeletonLoader";

export function CategoryList({ subCategory }) {
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    if (!loading) return;
    let isMounted = true;
    const fetchAllData = async () => {
      try {
        const requests = subCategory.map(async (item) => {
          try {
            const res = await API.getProducts(item.id_section);
            return { type: "category", id: item.id, data: res.data };
          } catch (error) {
            console.error("Error fetching item:", error);
            return null;
          }
        });

        const responses = await Promise.all(requests);
        if (!isMounted) return;

        const normalizedData = responses.reduce((acc, response) => {
          if (response) {
            // Нормализация данных для продуктов
            acc[response.id] =
              response.type === "product" ? response.data : response.data;
          }
          return acc;
        }, {});
      } catch (error) {
        console.error("Global fetch error:", error);
      } finally {
        setLoading(false);
        setTimeout(() => setIsVisible(true), 10);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [subCategory]);
  return !loading ? (
    <div className="flex w-full justify-center">
      <div className="grid grid-cols-2 gap-[20px_10px] ">
        {subCategory.map((item, index) => {
          return (
            <Link
              key={index}
              onClick={(e) => {
                e?.preventDefault();
                dispatch(changeCategoryName(item.name));
                navigate(`/categories?id=${item.id_section}&name=${item.name}`);
              }}
              className={`w-[46.2vw] h-[150px] relative fade-in transition-all duration-200 ${
                isVisible ? "visible" : ""
              }`}
            >
              <img
                className="absolute top-0 left-0 w-full h-full rounded-2xl object-cover "
                src={`https://shtuchki.pro/${item.detail_picture}`}
                alt=""
              />
            </Link>
          );
        })}
      </div>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-[20px_10px] ">
      <SkeletonLoader />
    </div>
  );
}
