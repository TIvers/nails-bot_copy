import { useEffect } from "react";

const WebAppCloser = () => {
  useEffect(() => {
    if (!window.Telegram?.WebApp) return;

    // Настраиваем поведение только для кнопки закрытия (не BackButton)
    Telegram.WebApp.setupClosingBehavior({
      need_confirmation: true,
      confirmation_text: "Вы уверены, что хотите прервать оплату?",
    });

    return () => {
      Telegram.WebApp.setupClosingBehavior({ need_confirmation: false });
    };
  }, []);

  return null;
};

export default WebAppCloser;
