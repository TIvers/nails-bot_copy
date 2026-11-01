import React from "react";

export default function OrderAdminItem({ item }) {
  // Calculate the price for this item
  const price = item.roznica_master_price || item.base_price;
  const itemTotal = price * (item?.quantity || 1);

  return (
    <div className="flex justify-between items-start">
      <p className="text-gray_dark text-base font-montserrat w-[70%]">
        {item.name}
      </p>
      <div className="flex justify-between items-center gap-[20px] w-[75px]">
        <p className="text-primary text-xl font-medium font-montserrat">
          {item.quantity}x
        </p>
        <span className="font-semibold text-2xl font-manrope">
          {itemTotal}₽
        </span>
      </div>
    </div>
  );
}
