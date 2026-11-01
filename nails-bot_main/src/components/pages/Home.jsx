import React, { useEffect, useState } from "react";
import { Products, Sidebar } from "../shared";
import { Button } from "../ui";
import { CATEGORIES } from "../../utils/data";
import { basket } from "../../utils/constants";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { API } from "../../api";
import { CategoryList } from "../shared/CategoryList";

const Home = ({ categories }) => {
  const { pathname } = useLocation();
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);
  const { currentCategory } = useSelector(({ user }) => user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      if (!currentCategory) {
        // Check if categories is available and not empty
        if (categories && categories.length > 0) {
          if (isMounted) setCategory(categories[0]);
          try {
            const subCategoryData = await API.getProducts(
              categories[0].id_section
            );
            setSubCategory(subCategoryData.data);
          } catch (error) {
            console.error("Error fetching subcategory:", error);
          } finally {
            setLoading(false);
          }
        } else {
          // No categories available, set loading to false
          setLoading(false);
        }
      } else {
        const categoryFind = categories.find(
          ({ id }) => +id === +currentCategory
        );
        if (categoryFind) {
          try {
            const subCategoryData = await API.getProducts(
              categoryFind.id_section
            );
            if (isMounted) {
              setCategory(categoryFind);
              setSubCategory(subCategoryData.data);
            }
          } catch (error) {
            console.error("Error fetching subcategory:", error);
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentCategory, categories]);

  return category ? (
    <main className="mb-[30px]">
      {/* <Sidebar categories={categories} /> */}
      {loading ? <></> : <CategoryList subCategory={subCategory} />}
      <Button
        className={"fixed bottom-[50px] right-[10px]"}
        type={basket}
        text="Корзина"
      />
    </main>
  ) : (
    <></>
  );
};

export default Home;
