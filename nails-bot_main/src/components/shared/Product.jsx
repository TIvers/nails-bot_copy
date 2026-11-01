import React, { useEffect, useState } from "react";
import { Title } from "../ui";
import { API } from "../../api";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { changeCurrentProduct } from "../../features/slice/userSlice";
import SkeletonLoader from "../ui/SkeletonLoader";

export function Product({ idItem, search, className }) {
  const dispatch = useDispatch();
  const [itemData, setItemData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false); // Для анимации

  useEffect(() => {
    if (!loading) return;
    const fetchAllData = async () => {
      try {
        const fetchProduct = await API.getProduct(idItem);
        setItemData(fetchProduct.data[0]);
      } catch (error) {
        console.error("Global fetch error:", error);
      } finally {
        setLoading(false);
        // Задержка для плавного появления после загрузки
        setTimeout(() => setIsVisible(true), 10);
      }
    };

    fetchAllData();
  }, []);

  return loading ? (
    <div className="space-y-[10px]">
      <SkeletonLoader />
    </div>
  ) : (
    <Link
      key={itemData.id}
      to={`/product/${itemData.id}`}
      onClick={() => dispatch(changeCurrentProduct(itemData))}
      className={` 
        flex flex-col h-full rounded-[10px] transition-all duration-200
        min-w-[46.2vw] bg-gray p-[6px] fade-in ${isVisible ? "visible" : ""} ${
        className ? className : ""
      }`}
    >
      <div className="flex-grow-0">
        <img
          className="rounded-[10px] w-full h-[100px] object-contain object-center"
          src={
            itemData?.preview_picture
              ? `https://shtuchki.pro${itemData.preview_picture}`
              : "/img/no_photo.webp"
          }
          alt={itemData.name}
        />
      </div>
      <div className="flex flex-col justify-between flex-grow">
        <Title text={itemData.name} size={"text-2xl"} />
        <div className={`text-2xl font-semibold mb-1 pt-2" `}>
          {itemData.roznica_master_price || itemData.base_price} ₽
        </div>
      </div>
    </Link>
  );
}
