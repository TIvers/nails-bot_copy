import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { ROUTES } from "../routes/routes";
import { useDispatch, useSelector } from "react-redux";
import { removeItemFromCart } from "../../features/slice/userSlice";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart } = useSelector(({ user }) => user);

  useEffect(() => {
    for (const item of cart) {
      dispatch(removeItemFromCart(item.id));
    }
    // Перенаправляем на страницу истории заказов через 3 секунды
    // const redirectTimer = setTimeout(() => {
    //   navigate(ROUTES.PROFILE);
    // }, 5000);

    // return () => clearTimeout(redirectTimer);
  }, [navigate]);

  return (
    <div className="min-h-[60vh] bg-gray-50 flex flex-col justify-center items-center">
      <div className="flex-1 flex flex-col items-center justify-center p-3">
        <div className="w-full">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-[#9bd79b]/20 p-3">
              <CheckCircle className="h-16 w-16 text-[#008000]" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black/80 mb-2">
              Заказ успешно создан!
            </h1>
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
          </div>
        </div>
      </div>
    </div>
  );
}
