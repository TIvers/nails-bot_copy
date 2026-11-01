import React, { useEffect, useState } from "react";
import { MapPin, ChevronLeft } from "lucide-react";

export default function DeliveryForm({
  formData,
  handleInputChange,
  deliveryOption,
  handleSelectDelivery,
  selectedStore,
  handleOpenModal,
  isDeliveryComplete,
  handleFinalSubmit,
  handlePrevStep,
  setPriceDelivery,
  sum,
}) {
  // Delivery options based on city
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [deliveryOptionParse, setDeliveryOptionParse] = useState();
  useEffect(() => {
    if (typeof deliveryOption === "string") {
      setDeliveryOptionParse(JSON.parse(deliveryOption));
    } else {
      setDeliveryOptionParse(deliveryOption);
    }
  }, [deliveryOption]);
  // Update delivery options when city changes
  useEffect(() => {
    updateDeliveryOptionsByCity(formData.city);
  }, [formData.city]);

  // Auto-select first delivery option when deliveryOption is null
  useEffect(() => {
    if (deliveryOptionParse?.id === null && deliveryOptions.length > 0) {
      const firstOption = deliveryOptions[0];
      handleSelectDelivery({
        id: firstOption.id,
        price: firstOption.price,
        bitrix_id: firstOption?.bitrix_id || null,
      });
      setPriceDelivery(firstOption.price);
    }
  }, [deliveryOptions, deliveryOptionParse?.id]);

  console.log(deliveryOptionParse);
  // Function to get delivery options based on city
  const updateDeliveryOptionsByCity = (city) => {
    const cityLower = city.toLowerCase();

    if (cityLower === "новосибирск") {
      setDeliveryOptions([
        {
          id: "selfPickup",
          title: "Самовывоз из магазина ШТУЧКИ.PRO",
          stores: [
            {
              deliveryId: 486,
              bitrix_id: 115,
              title: "НОВОСИБИРСК ТЦ КОНТИНЕНТ",
              city: "Новосибирск",
              time: "Пн-Вс с 10:00 до 21:00",
            },
            // {
            //   bitrix_id: 125,
            //   deliveryId: 494,
            //   title: "НОВОСИБИРСК ТЦ АУРА",
            //   city: "Новосибирск",
            //   time: "Пн-Вс с 10:00 до 22:00",
            // },
          ],
          price: 0,
          priceDisplay: "Бесплатно",
        },
        {
          id: "courier",
          bitrix_id: 131,
          deliveryId: 497,
          title: "Доставка курьером в Новосибирске",
          price: 300,
          priceDisplay: "300.00 ₽",
        },
        {
          bitrix_id: 151,
          deliveryId: 510,
          id: "boxberry",
          title: "Самовывоз из ПВЗ Boxberry",
          price: 255,
          priceDisplay: "255.00 ₽",
        },
      ]);
    } else if (cityLower === "томск") {
      setDeliveryOptions([
        {
          id: "selfPickup",
          title: "Самовывоз из магазина ШТУЧКИ.PRO",
          stores: [
            {
              bitrix_id: 2,
              deliveryId: 59,
              title: "ТОМСК ТЦ ЛЕТО",
              city: "Томск, ул. Нахимова 8, ст. 13",
              time: "Пн-Вс с 10:00 до 22:00",
            },
            {
              bitrix_id: 107,
              deliveryId: 82,
              title: "ТОМСК ТЦ ПРОСПЕКТ",
              city: "пр. Ленина, 159",
              time: "Пн-Вс с 10:00 до 19:00",
            },
            {
              bitrix_id: 110,
              deliveryId: 84,
              title: "ТОМСК ТЦ МАНЕЖ",
              city: "ул. Беринга, 10",
              time: "Пн-Вс с 10:00 до 21:00",
            },
            {
              bitrix_id: 83,
              deliveryId: 68,
              title: "СЕВЕРСК ТЦ МАРМЕЛАЙТ",
              city: "ул. Курчатова, 11А",
              time: "Пн-Вс с 10:00 до 21:00",
            },
          ],
          price: 0,
          priceDisplay: "Бесплатно",
        },
        {
          bitrix_id: 1,
          deliveryId: 457,
          id: "courier",
          title: "Курьером по Томску",
          price: 200,
          priceDisplay: "200.00 ₽",
        },
        {
          bitrix_id: 129,
          deliveryId: 495,
          id: "south_gate",
          title: "Курьером в Южные ворота",
          price: 300,
          priceDisplay: "300.00 ₽",
        },
        {
          bitrix_id: 130,
          deliveryId: 496,
          id: "park",
          title: "Курьером в Северный Парк",
          price: 250,
          priceDisplay: "250.00 ₽",
        },
        {
          bitrix_id: 151,
          deliveryId: 510,
          id: "boxberry",
          title: "Самовывоз из ПВЗ Boxberry",
          price: 166,
          priceDisplay: "166.00 ₽",
        },
      ]);
    } else {
      // Default options for other cities
      setDeliveryOptions([
        {
          bitrix_id: 72,
          deliveryId: 463,
          id: "russian_post",
          title: "Доставка по РФ Почтой России",
          price: 500,
          priceDisplay: "500.00 ₽",
        },
        {
          bitrix_id: 133,
          deliveryId: 499,
          id: "cdek",
          title: "СДЭК (Стоимость рассчитывается индивидуально)",
          price: null,
          priceDisplay: null,
        },
        {
          bitrix_id: 151,
          deliveryId: 510,
          id: "boxberry",
          title: "Самовывоз из ПВЗ Boxberry",
          price: 292,
          priceDisplay: "292.00 ₽",
        },
      ]);
    }
  };

  // Check if the current delivery option needs a form
  const isShowForm = ["selfPickup"].includes(deliveryOption.id);
  return (
    deliveryOptionParse && (
      <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between min-h-[80vh]">
        <div>
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              2
            </div>
            <span className="ml-3 font-medium">Выберите способ доставки</span>
          </div>

          <div className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {deliveryOptions.map((option) => (
                <div
                  key={option.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    deliveryOptionParse.id === option.id
                      ? "border-secondary"
                      : "border-gray-300 hover:border-pink-300"
                  }`}
                  onClick={() => {
                    handleSelectDelivery({
                      id: option.id,
                      price: option.price,
                      bitrix_id: option?.bitrix_id || null,
                    });
                    setPriceDelivery(option.price);
                  }}
                >
                  <div className="font-medium text-sm">{option.title}</div>
                  <div className="text-primary text-sm">
                    {sum() >= 2000 ? "Бесплатно" : option.priceDisplay}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {deliveryOptionParse.id === "selfPickup" && (
            <div className="mb-4">
              {selectedStore ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{selectedStore.title}</h3>
                      <p className="text-blue-500 text-sm">
                        {selectedStore.city}
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        {selectedStore.time}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenModal(deliveryOptions)}
                      className="text-primary text-sm font-medium hover:text-pink-600"
                    >
                      Изменить
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <MapPin
                    className="inline-block text-primary mr-2"
                    size={20}
                  />
                  <button
                    onClick={() => handleOpenModal(deliveryOptions)}
                    className="border border-gray-300 rounded px-4 py-2 text-sm font-medium hover:border-secondary transition-colors"
                  >
                    Выбрать магазин
                  </button>
                </div>
              )}
            </div>
          )}

          {deliveryOption.id === "boxberry" && (
            <div className="mb-4">
              <MapPin className="inline-block text-primary mr-2" size={20} />
              <button
                onClick={handleOpenModal}
                className="border border-gray-300 rounded px-4 py-2 text-sm font-medium hover:border-secondary transition-colors"
              >
                Выбрать ПВЗ Boxberry
              </button>
            </div>
          )}

          {!isShowForm && deliveryOptionParse.id !== null && (
            <div className="mb-4 border rounded-lg p-4">
              <h3 className="font-medium mb-4">Адрес доставки</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Область
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Индекс
                  </label>
                  <input
                    type="text"
                    name="index"
                    value={formData.index}
                    onChange={handleInputChange}
                    placeholder="Ваш индекс"
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Город</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Улица <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="Название улицы"
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-secondary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Дом <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    name="house"
                    value={formData.house}
                    onChange={handleInputChange}
                    placeholder="Номер дома"
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-secondary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Квартира <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleInputChange}
                  placeholder="Номер квартиры"
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-secondary"
                  required
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-col space-y-3">
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={!isDeliveryComplete()}
              className={`w-full py-3 px-6 rounded font-medium transition-colors bg-primary text-white ${
                isDeliveryComplete() ? "" : "opacity-50 cursor-not-allowed"
              }`}
            >
              Оформить заказ
            </button>

            <button
              type="button"
              onClick={() => handlePrevStep(1)}
              className="flex items-center justify-center py-[9px] rounded-[10px] hover:text-primary w-full bg-gray_dark/20"
            >
              <span>Вернуться назад</span>
            </button>
          </div>
        </div>
      </div>
    )
  );
}
