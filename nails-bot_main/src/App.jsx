import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Container, Header, Sidebar } from "./components/shared";
import AppRoutes from "./components/routes/AppRoutes";
import { API } from "./api";
import { recoveryAllCart } from "./features/slice/userSlice";
import { getAllCart } from "./utils/cart";
import { ROUTES } from "./components/routes/routes";
import { useLocation } from "react-router-dom";
import BackButton from "./components/ui/BackButton";
const categoryData = [
  "Гель-лак, гель и акрил",
  "Инструменты",
  "Оборудование",
  "Уход и депиляция",
  "Дизайн ногтей",
  "Специальные жидкости",
  "SALE!",
];
function App() {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const { pathname } = useLocation();
  const [showSidebar, setShowSidebar] = useState(null);

  useEffect(() => {
    // Use a closure variable to track if we've already fetched
    let isMounted = true;
    const abortController = new AbortController();

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Create an array of promises to fetch all data at once
        const fetchPromises = [];
        let userPromise = null;

        // Add user fetch promise if Telegram is available
        if (window.Telegram) {
          const tg = window.Telegram.WebApp;
          tg.expand();
          const userId = tg.initDataUnsafe.user.id;
          const username = tg.initDataUnsafe.user.username;

          userPromise = API.getUser(userId, username);
          fetchPromises.push(userPromise);
        }

        // Add categories fetch promise
        const categoriesPromise = API.getCategories();
        fetchPromises.push(categoriesPromise);

        // Wait for all promises to resolve
        const results = await Promise.all(fetchPromises);

        // Only update state if component is still mounted
        if (isMounted) {
          // Process user data if it was fetched
          if (userPromise) {
            const userResponse = results[0];
            if (userResponse && userResponse.success && userResponse.user) {
              setUser(userResponse.user);
            } else {
              console.error("User not found.");
            }
          }

          // Process categories data (will be last item if userPromise exists, otherwise first)
          const categoriesIndex = userPromise ? 1 : 0;
          const categoriesResponse = results[categoriesIndex];
          if (categoriesResponse && categoriesResponse.data) {
            const arr = categoriesResponse.data;
            arr.sort((a, b) => {
              const indexA = categoryData.indexOf(a.name);
              const indexB = categoryData.indexOf(b.name);
              if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
              }
              // If only one item is in the order array, prioritize it
              if (indexA !== -1) return -1;
              if (indexB !== -1) return 1;

              // If neither item is in the order array, maintain their relative position
              return 0;
            });
            setCategories(arr);
          }
        }
      } catch (error) {
        if (error.name !== "AbortError" && isMounted) {
          console.error("Error fetching data:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialData();

    // Cleanup function to abort fetch and prevent state updates after unmount
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Cart recovery effect
  useEffect(() => {
    dispatch(recoveryAllCart(getAllCart()));
  }, [dispatch]);

  // Sidebar visibility effect
  useEffect(() => {
    const isShow =
      (pathname === ROUTES.PROFILE && user?.admin) ||
      pathname === ROUTES.SEARCH ||
      pathname === ROUTES.CART ||
      pathname === ROUTES.CHECKOUT;
    setShowSidebar(isShow);
  }, [pathname, user]);
  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 w-screen h-screen flex flex-col justify-center items-center ">
        <div className="loader"></div>
      </div>
    );
  }
  return (
    <Container>
      <Header />
      {categories.length > 0 && !showSidebar && pathname !== "/payment" && (
        <Sidebar categories={categories} />
      )}
      {window.Telegram && <BackButton />}
      <AppRoutes categories={categories} user={user} isLoading={isLoading} />
    </Container>
  );
}

export default App;
