import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../routes/routes";

export default function SearchInput({ value, handleSearch, handleSubmit }) {
  return (
    <div className="fixed top-0 left-0 bg-white w-[100%] h-[70px] z-50">
      <form
        onSubmit={handleSubmit}
        className="flex justify-between items-center  py-1 px-4 gap-[10px] 
    rounded-[10px] bg-gray mt-[30px]"
      >
        <div className="w-7 h-7 flex items-center">
          <img src="./img/searchnobg.svg" alt="search" />
        </div>
        <input
          value={value}
          onChange={handleSearch}
          placeholder="Поиск..."
          type="text"
          className="w-[100%] h-7 font-montserrat"
        />
        <Link className="mr-1 w-6 h-6" to={ROUTES.HOME}>
          <img src="./img/close.svg" alt="close" className="min-w-6 min-h-6" />
        </Link>
      </form>
    </div>
  );
}
