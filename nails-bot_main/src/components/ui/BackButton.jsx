import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.Telegram?.WebApp?.isExpanded) {
      console.log("window.Telegram?.WebApp?.isExpanded");
      navigate(-1); // Закрыть WebView полностью
    } else {
      console.log(window.location.href.includes("web"));
      navigate(-1); // Попробовать вернуться назад (если внутри мини-приложения)
    }
  };

  useEffect(() => {
    if (!window.Telegram?.WebApp) return;

    Telegram.WebApp.BackButton.onClick(goBack);
    Telegram.WebApp.BackButton.show();

    return () => {
      Telegram.WebApp.BackButton.offClick(goBack);
      Telegram.WebApp.BackButton.hide();
    };
  }, []);

  return null;
};

export default BackButton;
