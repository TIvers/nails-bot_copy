import React, { useEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import { ROUTES } from "./routes";
import SingleProduct from "../pages/SingleProduct";
import SingleCategory from "../pages/SingleCategory";
import Cart from "../pages/Cart";
import SearchItems from "../pages/SearchItems";
import OrderHistory from "../pages/OrderHistory";
import OrderHistoryAdmin from "../pages/OrderHistoryAdmin";
import Checkout from "../pages/Checkout";
import Succes from "../pages/Succes";
import OrderSuccess from "../pages/OrderSuccess";

const AppRoutes = ({ user, categories }) => {
  if (!categories) {
    return (
      <div className="flex justify-center items-center w-[100wh] h-[100vh]">
        <span className="loader"></span>
      </div>
    );
  }
  return (
    categories && (
      <Routes>
        <Route path={ROUTES.HOME} element={<Home categories={categories} />} />
        <Route path={ROUTES.CATEGORY} element={<SingleCategory />} />
        <Route path={ROUTES.PRODUCT} element={<SingleProduct />} />
        <Route path={ROUTES.SEARCH} element={<SearchItems />} />
        <Route path={ROUTES.CHECKOUT} element={<Checkout user={user} />} />

        {user?.admin ? (
          <Route
            path={ROUTES.PROFILE}
            element={<OrderHistoryAdmin user={user} />}
          />
        ) : (
          <Route path={ROUTES.PROFILE} element={<OrderHistory user={user} />} />
        )}

        <Route path={ROUTES.CART} element={<Cart />} />
        <Route path={"/payment"} element={<Succes />} />
        <Route path={ROUTES.SUCCESS} element={<OrderSuccess />} />
      </Routes>
    )
  );
};

export default AppRoutes;
