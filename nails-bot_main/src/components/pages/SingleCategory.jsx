import React, { Suspense } from "react";
import { useEffect, useState } from "react";
import { Button, Title } from "../ui";
import { useNavigate, useSearchParams } from "react-router-dom";
import { basket } from "../../utils/constants";
import { API } from "../../api";
import { Product } from "../shared";
import { CategoryItem } from "../shared/CategoryItem";
import { X } from "lucide-react";
import SkeletonLoader from "../ui/SkeletonLoader";
const MemoProduct = React.memo(Product);
const MemoCategoryItem = React.memo(CategoryItem);
export default function SingleCategory() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const nameParam = searchParams.get("name");
  const decodedName = nameParam ? decodeURIComponent(nameParam) : "";
  const [itemsData, setItemsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCategory, setIsCategory] = useState(null);
  const [isVisible, setIsVisible] = useState(false); // Для контроля анимации

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    // Активируем анимации после монтирования
  }, [searchParams]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const fetchProduct = await API.getProducts(id);
        setItemsData(fetchProduct.data);
        setIsCategory(fetchProduct.data[0]?.hasOwnProperty("id_section"));
      } catch (error) {
        console.error("Global fetch error:", error);
      } finally {
        setLoading(false);
        setTimeout(() => setIsVisible(true), 10);
      }
    };

    fetchAllData();
  }, [id, nameParam]);
  console.log("itemsData", itemsData);
  return (
    <div className="relative min-h-[60vh]">
      {itemsData.length > 0 ? (
        <div className={`my-[30px] transition-opacity duration-300 `}>
          <Title text={decodedName} className={"mb-5"} />
          <div className="w-full flex justify-center h-full">
            {!isCategory ? (
              <div className="justify-self-center grid grid-cols-2 gap-[10px_10px]">
                {itemsData.map((product) => (
                  <div
                    key={product.id}
                    className="transition-all duration-300 ease-out hover:scale-[1.02]"
                  >
                    <Product idItem={product.id} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="justify-self-center grid grid-cols-2 gap-[10px_10px]">
                {itemsData.map((product) => (
                  <div
                    key={product.id}
                    className={`fade-in ${isVisible ? "visible" : ""}`}
                  >
                    <CategoryItem category={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : !loading && itemsData.length <= 0 ? (
        <div
          className={`flex items-center flex-col w-full justify-center absolute top-[50%] translate-y-[-50%]`}
        >
          <div className="flex items-center gap-4">
            <div className="h-[40px] w-[40px] rounded-full bg-primary relative">
              <X
                size={24}
                strokeWidth={3}
                stroke="#fff"
                className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
              />
            </div>
            <div>
              <h4>К сожалению, раздел пуст</h4>
              <p className="text-[12px]">
                В данный момент нет активных товаров
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center mt-10 py-[9px] rounded-[10px] w-[200px] bg-primary text-white hover:bg-primary-dark transition-colors duration-200"
          >
            <span>Вернуться назад</span>
          </button>
        </div>
      ) : (
        <div className={`my-[30px]`}>
          <Title text={decodedName} className={"mb-5"} />
          <div className="justify-self-center grid grid-cols-2 gap-[10px]">
            <SkeletonLoader count={8} />
          </div>
        </div>
      )}

      <Button
        className={`fixed bottom-[50px] right-[10px]`}
        type={basket}
        text="Корзина"
      />
    </div>
  );
}
