import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../routes/routes";
import { useDispatch } from "react-redux";
import {
  changeCurrentCategory,
  changePositionSidebar,
} from "../../features/slice/userSlice";
import { ShoppingCart } from "lucide-react";

export function Header() {
  const params = useLocation();
  const dispatch = useDispatch();
  const isSearch = params.pathname === "/search";
  const isPayment = params.pathname === "/payment";
  return !isSearch ? (
    <header className="flex justify-between items-center mt-[29px] mb-[13px]">
      <Link
        onClick={() => {
          dispatch(changeCurrentCategory(null));
          dispatch(changePositionSidebar(0));
        }}
        to={ROUTES.HOME}
      >
        <img
          className="w-[164px] h-[40px]"
          src="https://shtuchki.pro/local/templates/redline/dist/assets/img/icons/header-mobile__logo.svg"
          alt="ШТУЧКИ.PRO"
        />
      </Link>
      {!isPayment && (
        <div className="flex gap-5 items-center">
          <Link to={ROUTES.SEARCH}>
            <img src="/img/search.svg" alt="Поиск" />
          </Link>
          <Link className="w-[26px] h-[26px]" to={ROUTES.CART}>
            <div className="bg-secondary p-[4px] rounded-full">
              <ShoppingCart size={20} strokeWidth={2} className="text-white" />
            </div>
          </Link>
          <Link to={ROUTES.PROFILE}>
            <img src="/img/account.svg" alt="Личный кабинет" />
          </Link>
        </div>
      )}
    </header>
  ) : (
    <></>
  );
}
