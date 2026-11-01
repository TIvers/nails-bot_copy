import React, { useEffect, useState } from "react";

import { Title } from "../ui";
import OrderAdminItem from "./OrderAdminItem";

export default function OrdersByDay({ order, noDay }) {
  console.log("OrdersByDay", order);
  const [sum, setSum] = useState(0);
  const [time, setTime] = useState(null);
  const [timezone, setTimezone] = useState(null);
  useEffect(() => {
    if (order?.orderDate) {
      setTime(
        order?.orderDate.getHours() +
          ":" +
          order?.orderDate.getMinutes() +
          ":" +
          order?.orderDate.getSeconds()
      );
      setTimezone(order?.orderDate.toString().match(/GMT\+\d{2}:\d{2}/)[0]);
    }
  }, []);

  // Calculate total sum whenever order products change
  useEffect(() => {
    if (order && Array.isArray(order.products)) {
      const totalSum = order.products.reduce((acc, item) => {
        return acc + item.roznica_master_price * (item.quantity || 1);
      }, 0);
      setSum(totalSum);
    }
  }, [order]);

  // If order is undefined or missing properties, don't render anything
  if (!order) {
    return null;
  }

  return (
    <div>
      <Title
        text={`Заказ от ${
          order.time.split(" ")[0].split("-").reverse().join(".") ||
          "неизвестная дата"
        }`}
        className={"mb-5 text-primary"}
      />

      <div className="mb-[10px] bg-gray p-[6px] rounded-[10px]">
        <Title text={`Заказ №${order.order_id || "б/н"}`} size={"2xl"} />
        <div className="mt-[10px] mb-5 text-base font-montserrat text-gray_dark">
          <p className="mb-[5px]">Имя:&nbsp;{order.fio || "Не указано"}</p>
          <p>
            Время заказа:&nbsp;
            {time
              ? `${time} ${timezone}`
              : `${order.time
                  .split(" ")[0]
                  .split("-")
                  .reverse()
                  .join(".")} GMT+07:00`}
          </p>
          {order.deliveryName && (
            <p className="my-[5px]">
              Доставка: {order.deliveryName.replace("city", "")}
            </p>
          )}
          <p className="my-[5px]">
            Статус оплаты:{" "}
            <span
              className={`font-bold text-[12px] ${
                order.paid === "D" ? "text-[#d3902b]" : "text-[#4ca324]"
              }`}
            >
              {" "}
              {order.paid === "D" ? "Оплата при получении" : "Оплачено"}
            </span>
          </p>
          {order?.street && (
            <div className="space-y-[3px] mt-[5px]">
              <p>Город: {order?.city}</p>
              <p>Область: {order?.location}</p>
              <p>Улица: {order?.street}</p>
              <p>Дом: {order?.home}</p>
              <p>Квартира: {order?.flat}</p>
              <p>Индекс: {order?.index}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-[5px]">
          {Array.isArray(order.products) ? (
            order.products.map((item) => (
              <OrderAdminItem item={item} key={item.id} />
            ))
          ) : (
            <p>Нет данных о товарах</p>
          )}
        </div>
        <div className="flex justify-between items-center mt-5">
          <p>Общая стоимость заказа</p>
          <span className="font-manrope text-3xl font-semibold">{sum}₽</span>
        </div>
      </div>
    </div>
  );
}
