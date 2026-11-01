import React, { useEffect, useState } from "react";
import { Button, Title } from "../ui";
import { normal } from "../../utils/constants";

import Calendar from "../shared/Calendar";
import { useSortedOrders } from "../../hooks/useSortedOrders";
import OrdersByMonth from "../shared/OrdersByMonth";
import OrdersByDay from "../shared/OrdersByDay";
import { API, baseURL } from "../../api";

export default function OrderHistoryAdmin() {
  const [isCalendar, setIsCalendar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState([]);

  // Move useSortedOrders to the component body
  const sortedOrdersByDate = useSortedOrders(rawData);
  console.log("sortedOrdersByDate", sortedOrdersByDate);
  const fetchOrders = async () => {
    try {
      const option = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "admin",
        }),
      };
      const resp = await fetch(`${baseURL}get_orders.php`, option);
      const { data } = await API.parseResponse(resp);
      setRawData(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) {
      fetchOrders();
    }
  }, []);

  const setActiveCalendar = () => setIsCalendar(!isCalendar);
  const [list, setList] = useState(null);
  const resetList = () => setList(null);
  const filterByDate = (date) => {
    const filter = rawData.filter((order) => {
      const dateParts = order.time.split(" ")[0].split("-").reverse();
      dateParts[2] = dateParts[2].slice(-2); // Take only the last 2-digits of the year
      const newTime = dateParts.join(".");
      return date === newTime;
    });

    setList(filter);
  };
  console.log("rawData", rawData);
  if (loading) {
    return (
      <div className="flex flex-col justify-center min-h-[70vh]">
        <div className="loader"></div>
      </div>
    );
  }
  return (
    <div className="mb-8">
      <Title text={"История заказов"} />
      <Button
        onClick={setActiveCalendar}
        text={"Выберите дату"}
        type={normal}
        className={"w-full bg-secondary mt-3 mb-8"}
      />
      {isCalendar && (
        <div className="fixed top-0 left-0 w-full h-screen bg-white flex items-center">
          <Calendar
            setActiveCalendar={setActiveCalendar}
            filterByDate={filterByDate}
          />
        </div>
      )}

      {loading ? (
        <></>
      ) : sortedOrdersByDate.length > 0 && list === null ? (
        <div className="mt-5">
          {sortedOrdersByDate.map((orders, index) => (
            <OrdersByMonth key={index} orders={orders} />
          ))}
        </div>
      ) : list && list.length > 0 ? (
        <div>
          {list.map((item, index) => (
            <OrdersByDay index={index} order={item} key={item.id} />
          ))}
          <Button
            type={normal}
            text={"Отобразить все заказы"}
            className={"w-full mt-4"}
            onClick={resetList}
          />
        </div>
      ) : !sortedOrdersByDate.length > 0 ? (
        <div className="flex flex-col justify-center items-center gap-2">
          <p className="font-montserrat">У вас пока нет заказов</p>
          <div className="w-44 h-44">
            <img width={180} src="/img/nofaund.png" alt="nofaund" />
          </div>
        </div>
      ) : (
        <div className="h-full flex justify-center flex-col items-center gap-3">
          <div className="text-center">
            <p className="font-montserrat">Заказов в эту дату нет</p>
            <p className="font-montserrat text-base">
              Выберите другую дату или нажмите на отобразить все заказы
            </p>
          </div>
          <div className="w-44 h-44">
            <img width={180} src="/img/nofaund.png" alt="nofaund" />
          </div>
          <Button
            type={normal}
            text={"Отобразить все заказы"}
            className={"w-full"}
            onClick={resetList}
          />
        </div>
      )}
    </div>
  );
}
