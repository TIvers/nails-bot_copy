import { ArrowLeft, Ban, CheckCircle, ShoppingBag } from "lucide-react";
import React, { useEffect, useState } from "react";
import { baseURL } from "../../api";
import { useDispatch, useSelector } from "react-redux";
import { removeItemFromCart } from "../../features/slice/userSlice";

export default function Succes() {
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const { cart } = useSelector(({ user }) => user);
  const [isLoading, setIsLoading] = useState(true);
  const urlParams = new URLSearchParams(window.location.search);
  const paramValue = urlParams.get("success");
  const paramOrderId = urlParams.get("order");
  const isSucces = paramValue == "true";
  const TELEGRAM_BOT_LINK =
    "https://t.me/shtuchki_pro_bot/?startapp&addToHomeScreen";

  useEffect(() => {
    if (isSucces) {
      for (const item of cart) {
        dispatch(removeItemFromCart(item.id));
      }
    }
    // Redirect after 5 seconds
    const redirectTimer = setTimeout(() => {
      window.location.href = TELEGRAM_BOT_LINK;
    }, 6000);

    return () => clearTimeout(redirectTimer);
  }, []);

  const verifyPayment = async (orderId) => {
    if (!orderId) {
      setError("Не удалось получить идентификатор заказа");
      setIsLoading(false);
      return;
    }

    try {
      const fetchVerifyPayment = await fetch(`${baseURL}payment.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "get_payment_id",
          order_id: orderId,
        }),
      });

      const responseText = await fetchVerifyPayment.text();
      console.log("Raw response:", responseText);
      // Находим конец JSON-части
      const jsonEnd = responseText.indexOf("}") + 1;
      let paymentId = null;

      if (jsonEnd > 0 && jsonEnd < responseText.length) {
        // Получаем ID после JSON
        const idMatch = responseText.slice(jsonEnd).match(/"(\d+)"|(\d+)/);
        if (idMatch) {
          paymentId = idMatch[1] || idMatch[2];
        }
      }

      if (!paymentId) {
        setError("Не удалось получить идентификатор платежа");
        setIsLoading(false);
        return;
      }

      console.log("Extracted payment ID:", paymentId);

      const fetchPayment = await fetch(`${baseURL}payment.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "verify_payment",
          payment_id: paymentId,
        }),
      });
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setError("Произошла ошибка при подключении к серверу");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (paramOrderId) {
      verifyPayment(paramOrderId);
    } else {
      // Если ни в одном хранилище нет данных
      setError("Идентификатор заказа не найден");
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex flex-col justify-center items-center">
        <div className="flex-1 flex flex-col items-center justify-center p-3">
          <p>Проверка статуса заказа...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-gray-50 flex flex-col justify-center items-center">
      <div className="flex-1 flex flex-col items-center justify-center p-3">
        <div className="w-full">
          {/* Отображаем ошибку, если она есть */}
          {error && (
            <div className="mb-6 text-center">
              <div className="rounded-full bg-[#da2929]/5 p-3 inline-block">
                <Ban className="h-16 w-16 text-[#da2929]" />
              </div>
              <h1 className="text-3xl font-bold text-black/80 mb-2 mt-4">
                Ошибка заказа
              </h1>
              <p className="text-gray_dark">{error}</p>
            </div>
          )}

          {/* Показываем стандартное сообщение только если нет ошибки */}
          {!error && (
            <>
              <div className="flex justify-center mb-6">
                {isSucces ? (
                  <div className="rounded-full bg-[#9bd79b]/20 p-3">
                    <CheckCircle className="h-16 w-16 text-[#008000]" />
                  </div>
                ) : (
                  <div className="rounded-full bg-[#da2929]/5 p-3">
                    <Ban className="h-16 w-16 text-[#da2929]" />
                  </div>
                )}
              </div>

              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black/80 mb-2">
                  {isSucces
                    ? "Оплата прошла успешно!"
                    : "Произошла ошибка при оплате"}
                </h1>

                <div className="text-gray_dark">
                  {isSucces ? (
                    <>
                      <p style={{ lineHeight: 1.3 }} className="text-gray_dark">
                        В самое ближайшее время наш менеджер свяжется с вами.
                      </p>
                      <div
                        style={{ lineHeight: 1.5 }}
                        className="text-gray_dark text-[14px] mt-2"
                      >
                        Если остались вопросы : <br />
                        <div className="mt-4 text-[16px]">
                          <a
                            className="text-blue block mb-1"
                            href="https://t.me/shtuchki_pro"
                          >
                            @shtuchki_pro
                          </a>{" "}
                          <a href="tel:+79234579410"> +7 923 457 94 10</a>
                        </div>
                      </div>
                    </>
                  ) : (
                    "Через некоторое время попробуйте снова"
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="space-y-4">
          <a href={TELEGRAM_BOT_LINK} className="block w-full">
            <button className="w-full bg-primary rounded-xl py-2 px-4 flex items-center justify-center text-white">
              <ShoppingBag className="mr-3 h-4 w-4" />
              Вернуться в магазин
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
