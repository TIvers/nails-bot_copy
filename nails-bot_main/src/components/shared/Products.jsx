import React from "react";
import { Product } from "./index";
import { Link } from "react-router-dom";
import { outline } from "../../utils/constants";
import { Button, Title } from "../ui";
import { useDispatch } from "react-redux";
import { changeCurrentProduct } from "../../features/slice/userSlice";

export function Products({ categoryId, name, products }) {
  const dispatch = useDispatch();
  return (
    <div>
      <div
        to={`/categories/${categoryId}`}
        className="flex items-center justify-between mb-5"
      >
        <Title size={"text-3xl"} text={name} />

        <Button text="Все" type={outline} id={categoryId} />
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        {Array.isArray(products) ? (
          <>
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                onClick={() => dispatch(changeCurrentProduct(product))}
              >
                <Product item={product} />
              </Link>
            ))}
          </>
        ) : (
          <Link
            key={products.id}
            to={`/products/${products.id}`}
            onClick={() => dispatch(changeCurrentProduct(products))}
          >
            <Product item={products} />
          </Link>
        )}
      </div>
    </div>
  );
}
