import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  changeCurrentCategory,
  changePositionSidebar,
} from "../../features/slice/userSlice";

export const Sidebar = ({ categories }) => {
  console.log(categories);
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  let { pathname } = useLocation();
  const { currentCategory, positionSidebar } = useSelector(({ user }) => user);
  const dispatch = useDispatch();
  const [active, setActive] = useState(
    currentCategory ? currentCategory : categories[0]?.id
  );
  useEffect(() => {
    setActive(currentCategory ? currentCategory : categories[0]?.id);
  }, [currentCategory]);
  useEffect(() => {
    if (!id) return;
    if (pathname.split("/")[1] === "products") return;
  }, [id]);

  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const sidebarRef = useRef(null);
  const scrollPosRef = useRef(0);
  const isInitialRender = useRef(true);
  const previousActiveRef = useRef(active);

  // Set initial scroll position from Redux state when component mounts
  useEffect(() => {
    if (sidebarRef.current && positionSidebar !== undefined) {
      sidebarRef.current.scrollLeft = positionSidebar;
      scrollPosRef.current = positionSidebar;
    } else if (sidebarRef.current) {
      sidebarRef.current.scrollLeft = 0;
    }
    // Set flag that initial render is finished
    isInitialRender.current = false;
  }, [positionSidebar]);

  // Handle active category change
  useEffect(() => {
    // If not first render and category has changed
    if (!isInitialRender.current && previousActiveRef.current !== active) {
      previousActiveRef.current = active;
      // Restore saved scroll position
      setTimeout(() => {
        if (sidebarRef.current) {
          sidebarRef.current.scrollLeft = scrollPosRef.current;
          // Save position to Redux
          dispatch(changePositionSidebar(scrollPosRef.current));
        }
      }, 0);
    }
  }, [active, dispatch]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sidebarRef.current.offsetLeft);
    setScrollLeft(sidebarRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setHasDragged(true);
    e.preventDefault();
    const x = e.pageX - sidebarRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    const newScrollLeft = scrollLeft - walk;
    sidebarRef.current.scrollLeft = newScrollLeft;
    // Save current scroll position
    scrollPosRef.current = newScrollLeft;
    // Save position to Redux
    dispatch(changePositionSidebar(newScrollLeft));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setHasDragged(false), 0);
    // Save final scroll position after dragging
    if (sidebarRef.current) {
      scrollPosRef.current = sidebarRef.current.scrollLeft;
      // Save position to Redux
      dispatch(changePositionSidebar(scrollPosRef.current));
    }
  };

  const handleClickLink = (e, id) => {
    if (hasDragged) {
      e.preventDefault();
      return;
    }
    // Save current scroll position before changing category
    if (sidebarRef.current) {
      scrollPosRef.current = sidebarRef.current.scrollLeft;
      // Save position to Redux
      dispatch(changePositionSidebar(scrollPosRef.current));
    }
    setActive(id);
    dispatch(changeCurrentCategory(id));
  };

  // Handle any scroll event (mouse wheel, etc.)
  const handleScroll = () => {
    if (!isDragging && sidebarRef.current) {
      const newPosition = sidebarRef.current.scrollLeft;
      scrollPosRef.current = newPosition;
      // Save position to Redux
      dispatch(changePositionSidebar(newPosition));
    }
  };

  return (
    categories && (
      <ul
        ref={sidebarRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onScroll={handleScroll}
        className="flex gap-[5px] overflow-x-scroll mb-[30px] whitespace-nowrap"
      >
        {categories.map(({ name, id }) => (
          <li key={id} className="flex-shrink-0">
            <Link
              to={"/"}
              onClick={(e) => handleClickLink(e, id)}
              draggable={false}
            >
              <span
                className={`no-select block bg-primary text-white
                 text-xl font-medium px-3 pt-[10px] pb-[7px] rounded-b-xl
                 ${active !== id ? "pt-[10px]" : "pt-[30px]"}
                whitespace-nowrap`}
              >
                {name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )
  );
};
