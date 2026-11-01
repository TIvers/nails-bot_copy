import React, { useState, useEffect } from "react";
import { Button, Title } from "../ui";
import { useDispatch, useSelector } from "react-redux";
import { minus, normal, quantity } from "../../utils/constants";
import {
  addItemToCart,
  recoveryAllCart,
  removeItemFromCart,
} from "../../features/slice/userSlice";
import { ROUTES } from "../routes/routes";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../../api";
import SkeletonLoader, { CartSkeletonLoader } from "../ui/SkeletonLoader";

export default function Card() {
  const dispatch = useDispatch();
  const { cart } = useSelector(({ user }) => user);
  const [sum, setSum] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOrderValid, setOrderValid] = useState(false);
  const MIN_ORDER_AMOUNT = 100;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMaxQuantities = async () => {
      setLoading(true);
      try {
        const updatedCart = await Promise.all(
          cart.map(async (item, i) => {
            try {
              const checkItem = await API.checkItem(item.id_product);
              return {
                ...item,
                maxquantity: checkItem.quantity,
                active: checkItem.active,
              };
            } catch (e) {
              return { ...item, maxquantity: null };
            }
          })
        );
        dispatch(recoveryAllCart(updatedCart));
      } catch (error) {
        console.error("Ошибка при получении maxquantity:", error);
      } finally {
        setLoading(false);
      }
    };
    if (cart.length > 0) {
      fetchMaxQuantities();
    } else {
      setSum(0);
      setOrderValid(false);
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const sumCart = cart.reduce((acc, item) => {
      let price = item.roznica_master_price || item.base_price;
      if (item.quantity) {
        return acc + price * item.quantity;
      } else {
        return acc + price * 1;
      }
    }, 0);
    setSum(sumCart);
    setOrderValid(sumCart >= MIN_ORDER_AMOUNT);
  }, [cart]);
  const handleIncrement = (variant, id) => {
    let currentItem = cart.find((item) => item.id === id);
    if (variant === minus) {
      dispatch(
        currentItem.quantity > 1
          ? addItemToCart({
              ...currentItem,
              quantity: currentItem.quantity - 1,
            })
          : addItemToCart({ ...currentItem, quantity: currentItem.quantity })
      );
    } else
      dispatch(
        addItemToCart({
          ...currentItem,
          quantity: Math.min(currentItem.quantity + 1, currentItem.maxquantity),
        })
      );
  };
  const removeItem = (id) => {
    dispatch(removeItemFromCart(id));
  };

  // Проверка наличия хотя бы одного активного товара
  const hasActiveItems = cart.some((item) => item.active === "Y");

  // Новый обработчик для оформления заказа
  const handleCheckout = () => {
    if (!hasActiveItems) return;
    const filteredCart = cart.filter((item) => item.active === "Y");
    dispatch(recoveryAllCart(filteredCart));
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className=" ">
        <Title text={"Корзина товаров"} className={"mb-[30px]"} />
        <div className="w-full max-w-[500px] px-2">
          <CartSkeletonLoader count={cart?.length || 1} />
        </div>
        <div
          className={`fixed left-0 bottom-0 w-[100vw] shadow-[0px_0px_20px_rgba(0,0,0,0.1)]  p-[10px] bg-white ${
            isOrderValid ? "h-[123px]" : "h-[170px]"
          }`}
        >
          <div className="flex justify-between items-center mb-[15px]">
            <p className="text-base font-montserrat text-black ]">
              Общая стоимость заказа
            </p>
            <span className="font-semibold font-manrope text-3xl">0 ₽</span>
          </div>
          <div className=" w-[100%] bg-gray_dark rounded-[10px] animate-pulse flex items-center py-[9px] justify-center">
            <span className="text-white text-2xl font-manrope font-semibold">
              Загрузка...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return Array.isArray(cart) && cart.length ? (
    <div>
      <Title text={"Корзина товаров"} className={"mb-[30px]"} />
      <div className="flex flex-col gap-[15px] mb-[130px] overflow-y-scroll">
        {cart.map((item) => {
          let price = item.roznica_master_price || item.base_price;
          console.log("item", item);
          return (
            <div
              key={item.id}
              className="bg-gray rounded-[10px]  p-[6px] flex gap-[10px] items-center"
            >
              <div className="w-[38%] ">
                <img
                  src={
                    item?.preview_picture
                      ? `https://shtuchki.pro${item.preview_picture}`
                      : `/img/no_photo.webp`
                  }
                  alt={item.name}
                />
              </div>
              <div className="w-[62%]">
                <div className="mb-1">
                  <div className="relative flex justify-between items-center w-full">
                    <div className="pr-5">
                      <Title
                        text={item.name}
                        size={"2xl"}
                        className={"pr-2 leading-tight"}
                      />
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 ml-1 absolute top-0 right-0"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-trash-2"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" x2="10" y1="11" y2="17" />
                        <line x1="14" x2="14" y1="11" y2="17" />
                      </svg>
                    </button>
                  </div>
                  <Title text={item.subtitle} size={"2xl"} />
                </div>
                <p className="text-base font-montserrat text-gray_dark mb-3">
                  Артикул:&nbsp;{item.articul}
                </p>
                {item.active === "Y" ? (
                  <div className="flex justify-between items-center gap-2">
                    <Button
                      maxCount={item.maxquantity}
                      id={item.id}
                      type={quantity}
                      handleIncrement={handleIncrement}
                      count={item.quantity ? item.quantity : 1}
                      className={
                        " py-[5px] rounded-[6.5px] h-[24.6px] w-[77px]"
                      }
                      classNameIcons={"min-w-[30%]"}
                    />
                    {item.quantity ? (
                      <span className="font-3xl font-manrope font-semibold">
                        {price * item.quantity} ₽
                      </span>
                    ) : (
                      <span className="font-3xl font-manrope font-semibold">
                        {price} ₽
                      </span>
                    )}
                  </div>
                ) : (
                  <div className=" w-full border border-secondary rounded-lg py-1 text-center text-[14px]">
                    Cкоро будет добавлен
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div
        className={`fixed left-0 bottom-0 w-[100vw] shadow-[0px_0px_20px_rgba(0,0,0,0.1)]  p-[10px] bg-white ${
          isOrderValid ? "h-[123px]" : "h-[170px]"
        }`}
      >
        <div className="flex justify-between items-center mb-[15px]">
          <p className="text-base font-montserrat text-black ]">
            Общая стоимость заказа
          </p>
          <span className="font-semibold font-manrope text-3xl">
            {!hasActiveItems ? 0 : sum} ₽
          </span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={!isOrderValid || !hasActiveItems}
          className={`text-white block text-center 
          text-2xl font-manrope font-semibold rounded-[10px]
           ${
             isOrderValid && hasActiveItems
               ? "bg-secondary"
               : "bg-secondary/60 cursor-not-allowed"
           } py-[9px] w-full`}
        >
          Оформить
        </button>
        {!isOrderValid && (
          <p className="text-[16px] text-gray_dark mb-1 text-center mt-2 ">
            Минимальная сумма заказа 100 ₽. Добавьте еще товаров в корзину.
          </p>
        )}
        {!hasActiveItems && (
          <p className="text-[12px] text-gray_dark mb-1 text-center mt-2 ">
            Нет доступных для заказа товаров.
          </p>
        )}
      </div>
    </div>
  ) : (
    <div className="h-[70vh] flex flex-col justify-center items-center   text-center">
      <div className="w-[100px] h-[100px]">
        <img width={100} src="/img/cart.png" alt="" />
      </div>
      <div className="font-montserrat text-center flex flex-col gap-0">
        <p>В корзине пока пусто</p>
        <span className="text-base text-gray_dark">
          Корзина ждёт что её наполнят!
        </span>
      </div>
      <div className="w-[80%] mt-5">
        <Button
          text={"Перейти в каталог"}
          type={normal}
          to={ROUTES.HOME}
          className={"w-[80%] bg-secondary mt-[20px] mb-[30px] px-4"}
        />
      </div>
    </div>
  );
}
