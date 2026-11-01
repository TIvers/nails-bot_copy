import clsx from "clsx";
import React from "react";

export const Title = ({ text, size, className }) => {
  return (
    <h2
      className={clsx(
        `${size ? size : " text-3xl"} text-black font-manrope font-semibold `,
        className
      )}
    >
      {text}
    </h2>
  );
};
