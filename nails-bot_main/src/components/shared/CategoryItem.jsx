import React from "react";
import { Title } from "../ui";
import { Link } from "react-router-dom";
export function CategoryItem({ category }) {
  return (
    <Link
      to={`/categories?id=${category.id_section}&name=${category.name}`}
      onClick={() => {
        console.log("Category", category.id_section);
      }}
      className="w-[46.2vw] h-[150px] relative"
    >
      <img
        className=" w-full h-full object-cover rounded-2xl"
        src={
          category?.detail_picture
            ? `https://shtuchki.pro/${category.detail_picture}`
            : `/img/no_photo.webp`
        }
        alt={category.name}
      />
      {category.name === "Лаки El Corazon" && (
        <Title text={category.name} size={"text-2xl text-center"} />
      )}
    </Link>
  );
}
