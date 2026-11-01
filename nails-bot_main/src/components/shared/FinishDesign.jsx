import { useEffect, useState } from "react";
import { Button, Title } from "../ui";
import { useDispatch, useSelector } from "react-redux";
import { minus, normal, quantity } from "../../utils/constants";
import Cookies from "js-cookie";
import {
  addItemToCart,
  removeItemFromCart,
} from "../../features/slice/userSlice";

import { Link, useNavigate } from "react-router-dom";

import { API, baseURL } from "../../api";
import { NotificationPopup } from "./NotificationPopup";
import { ROUTES } from "../routes/routes";

export default function FinishDsesign({
  formData,
  selectedStore,
  priceDelivery,
  handlePrevStep,
  user,
  deliveryOption,
  sum,
}) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);
  const [massage, setMassage] = useState("");
  const [isError, setIsError] = useState(false);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { cart } = useSelector(({ user }) => user);
  console.log("deliveryOption", deliveryOption);
  // Dynamic payment options
  const getPaymentData = () => {
    if (deliveryOption?.bitrix_id === 1) {
      return [
        {
          id: 10,
          name: "При получении (Перевод / СБП / Наличные)",
        },
      ];
    }
    return [
      {
        id: 24,
        name: "Картой / СБП онлайн прямо сейчас",
      },
      {
        id: 10,
        name: "При получении (Перевод / СБП / Наличные)",
      },
    ];
  };
  const paymentData = getPaymentData();

  // Ensure activePayment is always valid
  const [activePayment, setActivePayment] = useState(paymentData[0].id);
  // Update activePayment if paymentData changes and current activePayment is not valid
  useEffect(() => {
    if (!paymentData.find((p) => p.id === activePayment)) {
      setActivePayment(paymentData[0].id);
    }
    // eslint-disable-next-line
  }, [deliveryOption]);

  if (cart.length === 0) {
    return (
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
        <div className="w-[80%]">
          <Button
            text={"Перейти в каталог"}
            type={normal}
            to={ROUTES.HOME}
            className={"w-[80%] bg-secondary mt-[20px] mb-[30px]"}
          />
        </div>
      </div>
    );
  }

  const handleIncrement = (variant, id) => {
    const currentItem = cart.find((item) => item.id === id);
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

  const handleSubmit = async () => {
    // if (!user?.id_tg) {
    //   setMassage("Не удалось распознать пользователя");
    //   setIsError(true);
    //   setShowNotification(true);
    //   setTimeout(() => {
    //     setShowNotification(false);
    //     setMassage("");
    //     setIsError(false);
    //   }, 2000);
    //   return; // Выходим из функции, если пользователь не распознан
    // }
    setIsLoading(true);
    const productsData = cart.map((product) => ({
      productId: product.id_product,
      quantity: product.quantity,
      name: product.name,
      price: product.roznica_master_price || product.base_price,
    }));
    const productsObject = productsData.reduce((acc, product, index) => {
      acc[index] = product;
      return acc;
    }, {});

    const sumPrice = sum() >= 2000 ? sum() : sum() + deliveryOption?.price;
    const bodyOption =
      deliveryOption.id === "selfPickup"
        ? JSON.stringify({
            type: "new_order",
            price: sumPrice,
            userId: user?.id_tg || 792820756,
            products: productsObject,
            paySystemId: activePayment,
            deliveryId: selectedStore?.bitrix_id || selectedStore.deliveryId,
            fio: `${formData.lastName} ${formData.firstName} ${formData?.middleName}`,
            phone: formData.phone,
            email: formData.email,
            city: formData.city,
            id_tg_user: user?.id_tg || 792820756,
          })
        : JSON.stringify({
            type: "new_order_and_delivery",
            price: sumPrice,
            userId: user?.id_tg || 792820756,
            products: productsObject,
            paySystemId: activePayment,
            fio: `${formData.lastName} ${formData.firstName} ${formData?.middleName}`,
            phone: formData.phone,
            email: formData.email,
            id_tg_user: user?.id_tg || 792820756,
            deliveryId: deliveryOption?.bitrix_id || deliveryOption?.deliveryId,
            city: formData.city,
            location: formData.region,
            index: formData.index,
            street: formData.street,
            home: formData.house,
            flat: formData.apartment,
          });
    try {
      const option = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: bodyOption,
      };

      const resp = await fetch(`${baseURL}order.php`, option);
      const { data } = await API.parseResponseTwo(resp);
      console.log("dataresp", data);
      if (!data || !data.order_id) {
        // // Clear the cart
        // cart.forEach((item) => removeItem(item.id));
        // Show error notification
        setMassage("Ошибка при создании заказа.");
        setIsError(true);
        setShowNotification(true);
        setIsLoading(false);

        // Redirect to home page after showing the error
        await setTimeout(() => {
          setShowNotification(false);
          setMassage("");
          setIsError(false);
          // navigate("/");
        }, 2000);

        return; // Exit the function early
      }
      const handlePaymentClickTwo = (link) => {
        if (window.Telegram?.WebApp) {
          Telegram.WebApp.openLink(link, { try_instant_view: false });
          // window.location.href = link;
        } else {
          window.open(link, "_blank");
        }
      };

      if (activePayment === 24) {
        const fetchPayment = await fetch(`${baseURL}payment.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "init_payment",
            amount: sumPrice * 100,
            id_tg_user: user?.id_tg || 792820756,
            order_id: data.order_id,
          }),
        });

        // Get the raw text response
        const responseText = await fetchPayment.text();

        // Split the response into two parts if it contains two JSON objects
        const jsonParts = responseText.split("}{");
        let dataFetchPayment;

        if (jsonParts.length > 1) {
          // If we have two parts, take the second part (the payment data)
          // and add back the curly braces
          dataFetchPayment = JSON.parse("{" + jsonParts[1]);
        } else {
          // If it's a single JSON object, parse it normally
          dataFetchPayment = JSON.parse(responseText);
        }
        if (window.Telegram?.WebApp) {
          handlePaymentClickTwo(dataFetchPayment.payment_url);
        } else {
          window.location.assign(dataFetchPayment.payment_url);
        }
      } else {
        // Перенаправляеaм на страницу успешного создания заказа
        await fetch(`${baseURL}payment.php`, {
          method: "POST",
          body: JSON.stringify({
            type: "init_payment_on_delivery",
            order_id: data.order_id,
          }),
        });
        navigate(ROUTES.SUCCESS);
      }

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.log(err);
    } finally {
    }
  };

  return (
    <div>
      {/* {isOpen && <WebAppCloser />} */}
      <NotificationPopup
        isVisible={showNotification}
        message={massage}
        isError={isError}
      />
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/20 z-40">
          <div className="fixed top-0 left-0  w-full h-full z-50 flex items-center flex-col justify-center">
            <div className="loader"></div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow p-6 mb-2">
        <div className="flex items-center ">
          <div className="min-w-8 min-h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            1
          </div>

          <span className="ml-3 font-medium">
            Получатель:
            <p>
              {formData.firstName} {formData.lastName} {formData.phone}
            </p>
          </span>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-2">
        <div className="flex items-center ">
          <div className="min-w-8 min-h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            2
          </div>
          <span className="ml-3 font-medium">
            {selectedStore
              ? selectedStore?.title || "Самовывоз из ПВЗ Boxberry"
              : `${formData.street} дом ${formData.house} квартира ${formData.apartment} `}
          </span>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-2">
        <div className="flex items-center ">
          <div className="min-w-8 min-h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            3
          </div>
          <span className="ml-3 font-medium">Выбор способа оплаты</span>
        </div>
        <div className="mt-7 space-y-4 pl-1">
          {paymentData.map((el) => (
            <button
              onClick={() => setActivePayment(el.id)}
              key={el.id}
              className="flex items-center  gap-3"
            >
              <div className="min-h-[18px] min-w-[18px] rounded-full border border-primary flex items-center flex-col justify-center">
                <span
                  className={`h-[10px] w-[10px] rounded-full bg-primary ${
                    el.id === activePayment ? "block" : "hidden"
                  }`}
                ></span>
              </div>
              <p className="text-start">{el.name}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 ">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            4
          </div>
          <span className="ml-3 font-medium">Завершение оформления</span>
        </div>
        <div className="flex flex-col gap-[15px]">
          {cart.map((item) => {
            const price = item.roznica_master_price || item.base_price;
            console.log(cart);
            return (
              <div
                key={item.id}
                className="bg-gray rounded-[10px]  flex gap-1 items-center py-2 pr-2"
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
                        <h3
                          style={{ lineHeight: 1.25 }}
                          className="text-black font-manrope font-medium text-[14px] pr-2"
                        >
                          {item.name}
                        </h3>
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
                  <div className="flex justify-between items-center gap-2">
                    <Button
                      id={item.id}
                      type={quantity}
                      maxCount={item.maxquantity}
                      handleIncrement={handleIncrement}
                      count={item.quantity ? item.quantity : 1}
                      className={
                        " py-[5px] rounded-[6.5px] h-[24.6px] w-[77px]"
                      }
                      classNameIcons={"min-w-[30%]"}
                    />
                    {item.quantity ? (
                      <span className="text-[17px] font-manrope font-semibold">
                        {price * item.quantity} ₽
                      </span>
                    ) : (
                      <span className="text-[17px] font-manrope font-semibold">
                        {price} ₽
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mt-2 mb-[160px]">
        <div className=" mt-4  flex justify-between">
          <div className="flex flex-col  gap-2">
            <span className=" text-[16px]">Cумма</span>
            <span className="text-[20px]">{sum()} ₽</span>
          </div>
          <div className="flex flex-col  gap-2">
            <span className=" text-[16px]">Доставка</span>
            <span className="text-[20px]">
              {sum() >= 2000 ? 0 : deliveryOption.price || 0} ₽
            </span>
          </div>
          <div className="flex flex-col  gap-2 text-primary">
            <span className="text-[16px] ">Итого</span>
            <span className="text-[20px]">
              {sum() >= 2000 ? sum() : sum() + deliveryOption?.price} ₽
            </span>
          </div>
        </div>
      </div>
      <div className="fixed left-0 bottom-0 w-[100vw] h-[163px] p-[10px] bg-white">
        <div className="flex justify-between items-center mb-[15px]">
          <p className="text-base font-montserrat text-black ">
            Общая стоимость заказа
          </p>
          <span
            className="font-semibold 
            font-manrope text-3xl"
          >
            {sum() >= 2000 ? sum() : sum() + deliveryOption?.price} ₽
          </span>
        </div>
        <div className="space-y-2">
          <Link
            onClick={() => handleSubmit()}
            className="text-white block text-center 
          text-2xl font-manrope font-semibold rounded-[10px]
           bg-secondary  py-[9px] w-full"
          >
            Оформить
          </Link>
          <button
            type="button"
            onClick={() => handlePrevStep(2)}
            className="flex
             items-center justify-center py-[9px] rounded-[10px]
               hover:text-primary w-full bg-gray_dark/20"
          >
            <span>Вернуться назад</span>
          </button>
        </div>
      </div>
    </div>
  );
}
