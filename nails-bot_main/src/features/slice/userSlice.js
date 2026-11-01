import { createSlice } from "@reduxjs/toolkit";
import { useEffect } from "react";
import { CategoryItem } from "../../components/shared/CategoryItem";

const userSlice = createSlice({
  name: "user",
  initialState: {
    cart: [],
    currentCategory: null,
    product: null,
    categoryName: null,
    positionSidebar: 0,
  },
  reducers: {
    changePositionSidebar: (state, { payload }) => {
      state.positionSidebar = payload;
    },
    changeCategoryName: (state, { payload }) => {
      state.categoryName = payload;
    },
    changeCurrentProduct: (state, { payload }) => {
      state.product = payload;
    },
    changeCurrentCategory: (state, { payload }) => {
      state.currentCategory = payload;
    },
    addItemToCart: (state, { payload }) => {
      console.log("payload", payload);
      let newCart = [...state.cart];
      const found = state.cart.find(({ id }) => id === payload.id);
      if (found) {
        newCart = newCart.map((item) => {
          return item.id === payload.id
            ? { ...item, quantity: payload.quantity || item.quantity + 1 }
            : item;
        });
      } else newCart.push({ ...payload, quantity: payload.quantity || 1 });
      state.cart = newCart;
      const cartData = JSON.stringify({
        ...payload,
        quantity: payload.quantity,
      });
      const setCookie = (name, value, days) => {
        const expires = new Date(Date.now() + days * 86400000).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(
          value
        )}; expires=${expires}; path=/`;
      };
      setCookie(`cart_${payload.id}`, cartData, 7); // cookies на 7 дней
      localStorage.setItem(`cart_${payload.id}`, cartData);
      sessionStorage.setItem(`cart_${payload.id}`, cartData);
    },
    removeItemFromCart: (state, { payload }) => {
      state.cart = state.cart.filter(({ id }) => id !== payload);
      function setCookie(name, value, options = {}) {
        options = {
          path: "/",
          // при необходимости добавьте другие значения по умолчанию
          ...options,
        };

        if (options.expires instanceof Date) {
          options.expires = options.expires.toUTCString();
        }

        let updatedCookie =
          encodeURIComponent(name) + "=" + encodeURIComponent(value);

        for (let optionKey in options) {
          updatedCookie += "; " + optionKey;
          let optionValue = options[optionKey];
          if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
          }
        }

        document.cookie = updatedCookie;
      }
      setCookie(`cart_${payload}`, "", {
        "max-age": -1,
      });
      localStorage.removeItem(`cart_${payload}`);
      sessionStorage.removeItem(`cart_${payload}`);
    },
    recoveryAllCart: (state, { payload }) => {
      state.cart = payload;
    },
    clearCart: (state) => {
      state.cart = [];
      // Удаляем все cart_* из localStorage, sessionStorage и cookies
      const removeAllCartKeys = (storage) => {
        Object.keys(storage)
          .filter((key) => key.startsWith("cart_"))
          .forEach((key) => storage.removeItem(key));
      };
      removeAllCartKeys(localStorage);
      removeAllCartKeys(sessionStorage);
      if (typeof Cookies !== "undefined") {
        Object.keys(Cookies.get()).forEach((key) => {
          if (key.startsWith("cart_")) Cookies.remove(key);
        });
      }
    },
  },
  extraReducers: (builder) => {},
});
export const {
  changeCurrentProduct,
  addItemToCart,
  removeItemFromCart,
  recoveryAllCart,
  changeCurrentCategory,
  changeCategoryName,
  changePositionSidebar,
  clearCart,
} = userSlice.actions;
export default userSlice.reducer;
