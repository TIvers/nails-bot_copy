import React, { useEffect, useState, useRef } from "react";
import { API, baseURL } from "../../api";

export default function CustomerForm({
  formData,
  handleInputChange,
  handlePhoneInput,
  validPhone,
  validEmail,
  phoneError,
  emailError,
  formIsValid,
  handleSubmitFirstForm,
  setFormData,
}) {
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const cityInputRef = useRef(null);
  const cityDropdownRef = useRef(null);

  const fetchSearch = async (search) => {
    if (!search || search.trim() === "") {
      setSearchData([]);
      return;
    }
    setLoading(true);
    try {
      const option = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search: search,
        }),
      };
      const searchAPI = await fetch(`${baseURL}get_region.php`, option);
      const { data } = await API.parseResponse(searchAPI);
      setSearchData(data);
      console.log("search, data", data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let debounceTimer;
    if (isInputFocused && formData.city) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchSearch(formData.city);
      }, 200);
    }
    return () => clearTimeout(debounceTimer);
  }, [formData.city, isInputFocused]);

  // Обработчик кликов вне списка городов
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target)
      ) {
        setSearchData([]);
        setIsInputFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Сброс состояния при размонтировании компонента
  useEffect(() => {
    return () => {
      setSearchData([]);
      setIsInputFocused(false);
    };
  }, []);

  const handleCitySelect = (city, region) => {
    setFormData((prev) => ({
      ...prev,
      city: city,
      region: region,
    }));
    setSearchData([]);
    setIsInputFocused(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
          1
        </div>
        <span className="ml-3 font-medium">Получатель</span>
      </div>

      <form onSubmit={handleSubmitFirstForm}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Телефон <span className="text-primary">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handlePhoneInput}
            onBlur={() => validPhone()}
            placeholder="+7 (___) ___-__-__"
            className={`w-full p-3 border ${
              phoneError ? "border-red-500" : "border-gray-300"
            } rounded focus:outline-none focus:border-secondary`}
            required
          />
          {phoneError && (
            <p className="text-secondary text-[12px] mt-1">{phoneError}</p>
          )}
        </div>
        <div className="mb-4 relative">
          <label className="block text-sm font-medium mb-1">
            Город <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            name="city"
            ref={cityInputRef}
            value={formData.city}
            onChange={handleInputChange}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => {
              setTimeout(() => {
                setIsInputFocused(false);
                setSearchData([]);
              }, 100);
            }}
            placeholder="Ваш город"
            className="w-full p-3 border border-gray-300 
              rounded focus:outline-none focus:border-secondary"
            required
          />
          {isInputFocused && searchData.length > 0 && (
            <div
              ref={cityDropdownRef}
              className="absolute top-[74px] left-0 w-full h-auto rounded rounded-t-none bg-white py-3  border border-t-0   border-secondary space-y-3 z-10"
            >
              {searchData.map((el, index) => (
                <div
                  key={index}
                  className="text-black/80 cursor-pointer hover:bg-gray-100 px-3 py-1"
                  onClick={() => handleCitySelect(el.name, el.region)}
                >
                  {el.name}, {el.region}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Фамилия <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Ваша фамилия"
            className="w-full p-3 border border-gray-300 rounded 
            focus:outline-none focus:border-secondary"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Имя <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Ваше имя"
              className="w-full p-3 border border-gray-300 rounded 
              focus:outline-none focus:border-secondary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Отчество</label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleInputChange}
              placeholder="Ваше отчество"
              className="w-full p-3 border border-gray-300 rounded
              focus:outline-none focus:border-secondary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              E-mail <span className="text-primary">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={() => validEmail()}
              placeholder="example@example.com"
              className={`w-full p-3 border ${
                emailError ? "border-red-500" : "border-gray-300"
              } rounded focus:outline-none focus:border-secondary`}
              required
            />
            {emailError && (
              <p className="text-secondary text-[12px] mt-1">{emailError}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!formIsValid}
          className={`w-full py-3 px-6 rounded font-medium transition-colors bg-primary text-white ${
            formIsValid ? "" : "opacity-50 cursor-not-allowed"
          }`}
        >
          Далее
        </button>
      </form>
    </div>
  );
}
