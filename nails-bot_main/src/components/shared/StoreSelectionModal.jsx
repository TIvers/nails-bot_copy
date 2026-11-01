import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function StoreSelectionModal({
  isOpen,
  onClose,
  onSelectStore,
  shops,
  setSelectedStore,
}) {
  const [selected, setSelected] = useState(null);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleSelectStore = (store) => {
    setSelectedStore((prevData) => ({
      ...prevData,
      deliveryId: store.deliveryId,
    }));
    setSelected(store);
  };

  const handleConfirm = () => {
    if (selected) {
      onSelectStore(selected);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium w-[90%]">
            Выберите магазин, откуда хотите забрать покупку
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4">
          {shops[0].stores.map((store, index) => (
            <div
              key={index}
              className="mb-4 border-b pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex justify-between gap-2 items-center">
                <div>
                  <h3 className="font--semibold">{store.title}</h3>
                  <p className="text-blue text-sm">{store.city}</p>
                  <p className="text-gray-600 font-light text-sm mt-1">
                    {store.time}
                  </p>
                </div>
                <button
                  onClick={() => handleSelectStore(store)}
                  className={`border border-primary  hover:bg-primary
                     hover:text-white transition-colors px-4 py-2 
                     rounded text-sm ${
                       selected === store
                         ? "bg-primary text-white "
                         : "bg-white text-primary"
                     }`}
                >
                  Выбрать
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className={`w-full py-3 rounded-md font-medium bg-primary text-white ${
              selected ? "" : " cursor-not-allowed opacity-80"
            }`}
          >
            Подтвердить выбор
          </button>
        </div>
      </div>
    </div>
  );
}
