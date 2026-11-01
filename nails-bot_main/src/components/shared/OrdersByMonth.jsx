import React from "react";

import { useGetDate } from "../../hooks/useGetDate";
import { Title } from "../ui";
import OrdersByDay from "./OrdersByDay";

export default function OrdersByMonth({ orders }) {
  console.log("orders OrdersByMonth", orders);
  const { getMonth, year } = useGetDate(orders.monthYear);

  return (
    <div className="w-[100%] mb-[20px]">
      <Title text={`${getMonth} ${year}`} className={"mb-5"} />
      {orders.orders.map((item, index) => (
        <div key={index}>
          <OrdersByDay noDay={true} index={index} order={item} />
        </div>
      ))}
    </div>
  );
}
