import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, MapPin, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { baseURL } from "../../api";
const cityToRegionMap = {
  Москва: "Московская ",
  "Санкт-Петербург": "Ленинградская",
  Новосибирск: "Новосибирская ",
  Екатеринбург: "Свердловская",
  Казань: "Республика Татарстан",
  "Нижний Новгород": "Нижегородская ",
  Челябинск: "Челябинская",
  Самара: "Самарская",
  Омск: "Омская",
  "Ростов-на-Дону": "Ростовская",
  Уфа: "Республика Башкортостан",
  Красноярск: "Красноярский край",
  Воронеж: "Воронежская",
  Пермь: "Пермский край",
  Волгоград: "Волгоградская",
  Краснодар: "Краснодарский край",
  Саратов: "Саратовская",
  Тюмень: "Тюменская",
  Тольятти: "Самарская",
  Ижевск: "Удмуртская Республика",
  Барнаул: "Алтайский край",
  Ульяновск: "Ульяновская",
  Иркутск: "Иркутская",
  Хабаровск: "Хабаровский край",
  Ярославль: "Ярославская",
  Владивосток: "Приморский край",
  Махачкала: "Республика Дагестан",
  Томск: "Томская",
  Оренбург: "Оренбургская",
  Кемерово: "Кемеровская",
  Новокузнецк: "Кемеровская",
  Рязань: "Рязанская",
  Астрахань: "Астраханская",
  "Набережные Челны": "Республика Татарстан",
  Пенза: "Пензенская",
  Липецк: "Липецкая",
  Киров: "Кировская",
  Чебоксары: "Чувашская Республика",
  Тула: "Тульская",
  Калининград: "Калининградская",
};
// City coordinates mapping for common Russian cities
const CITY_COORDINATES = {
  москва: [55.7558, 37.6173],
  "санкт-петербург": [59.9343, 30.3351],
  новосибирск: [55.0084, 82.9357],
  екатеринбург: [56.8389, 60.6057],
  казань: [55.7887, 49.1221],
  "нижний новгород": [56.2965, 43.9361],
  челябинск: [55.1644, 61.4368],
  омск: [54.9924, 73.3686],
  самара: [53.1958, 50.1112],
  "ростов-на-дону": [47.2357, 39.7015],
  уфа: [54.7431, 55.9678],
  красноярск: [56.0184, 92.8672],
  воронеж: [51.672, 39.1843],
  пермь: [58.0105, 56.2502],
  волгоград: [48.708, 44.5133],
  краснодар: [45.0448, 38.976],
  саратов: [51.5406, 46.0086],
  тюмень: [57.1522, 65.5272],
  тольятти: [53.5088, 49.4192],
  ижевск: [56.8498, 53.2045],
  барнаул: [53.3606, 83.7636],
  ульяновск: [54.3181, 48.3924],
  иркутск: [52.2898, 104.28],
  хабаровск: [48.4827, 135.0846],
  ярославль: [57.6261, 39.8845],
  владивосток: [43.1198, 131.8869],
  махачкала: [42.9849, 47.5047],
  томск: [56.4977, 84.9744],
  оренбург: [51.7727, 55.0988],
  кемерово: [55.3333, 86.0833],
  // Add more cities as needed
};

// Default coordinates for Russia (Moscow)
const DEFAULT_COORDINATES = [55.7558, 37.6173];

export default function BoxberrySelectionModal({
  isOpen,
  onClose,
  onSelectStore,
  formData,
  setFormData,
}) {
  if (isOpen) {
    document.body.style.overflow = "hidden";
  }
  const API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [coordinates, setCoordinates] = useState(null);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [boxberryPoints, setBoxberryPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  console.log("selectedPoint", selectedPoint);
  const mapRef = useRef(null);
  const yandexMapRef = useRef(null);
  const placemarkerRef = useRef(null);
  const pointPlacemarkCollection = useRef(null);

  // Get coordinates based on city name
  const getCityCoordinates = (cityName) => {
    if (!cityName) return DEFAULT_COORDINATES;

    // Normalize city name (lowercase, trim)
    const normalizedCityName = cityName.toLowerCase().trim();

    // Return coordinates if found, otherwise default
    return CITY_COORDINATES[normalizedCityName] || DEFAULT_COORDINATES;
  };

  // Set initial map center based on formData.city
  const initialMapCenter =
    formData && formData.city
      ? getCityCoordinates(formData.city)
      : DEFAULT_COORDINATES;

  const initialZoom = 12;

  // Fetch Boxberry points from the API
  const fetchAPIBoxberry = async () => {
    try {
      setIsLoading(true);
      const boxberryApi = await fetch(`${baseURL}boxberry_listPoints.php`);
      const data = await boxberryApi.json();

      // Extract and transform points into a usable format
      const points = data
        .map((point) => ({
          id: point.Code,
          name: point.Name,
          address: point.Address,
          coordinates: point.GPS
            ? convertGPSStringToCoordinates(point.GPS)
            : null,
          metro: point.Metro || "",
          schedule: point.WorkSchedule || "",
          phone: point.Phone || "",
          city: point.CityName,
          tripdescription: point.TripDescription,
        }))
        .filter((point) => point.coordinates !== null); // Filter out points without valid coordinates

      setBoxberryPoints(points);
      console.log("Loaded boxberry points:", points.length);
    } catch (err) {
      console.error("Error fetching Boxberry points:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert GPS string to coordinates array
  const convertGPSStringToCoordinates = (gpsString) => {
    if (!gpsString || typeof gpsString !== "string") return null;

    // GPS format is typically "latitude,longitude"
    try {
      const coordinates = gpsString.split(",");
      if (coordinates.length !== 2) return null;

      const lat = parseFloat(coordinates[0].trim());
      const lng = parseFloat(coordinates[1].trim());

      if (isNaN(lat) || isNaN(lng)) return null;

      // Make sure values are within valid range
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn("Invalid GPS coordinates (out of range):", gpsString);
        return null;
      }

      return [lat, lng];
    } catch (e) {
      console.error("Error parsing GPS coordinates:", gpsString, e);
      return null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAPIBoxberry();
    }
  }, [isOpen]);

  // If formData.city changes, update coordinates for the map
  useEffect(() => {
    if (formData && formData.city && yandexMapRef.current) {
      const cityCoords = getCityCoordinates(formData.city);
      yandexMapRef.current.setCenter(cityCoords, initialZoom);
    }
  }, [formData?.city]);

  // Initialize map when component mounts and modal is open
  const initMap = useCallback(() => {
    // Return early if map is already initialized or DOM element is not ready
    if (isMapInitialized || !mapRef.current || !window.ymaps) return;

    window.ymaps.ready(() => {
      // Check that DOM element exists and has dimensions
      if (
        mapRef.current &&
        mapRef.current.offsetWidth > 0 &&
        mapRef.current.offsetHeight > 0 &&
        !yandexMapRef.current // Ensure map doesn't already exist
      ) {
        console.log("Creating new map instance");

        // Create map instance
        const map = new window.ymaps.Map(mapRef.current, {
          center: initialMapCenter,
          zoom: initialZoom,
          controls: ["zoomControl"],
        });

        // Create a collection for Boxberry points
        const pointsCollection = new window.ymaps.GeoObjectCollection(null, {
          preset: "islands#redIcon",
        });

        // Keep map click handler but without placemark updates
        map.events.add("click", (e) => {
          const coords = e.get("coords");
          setCoordinates(coords);

          // Reverse geocode to get address
          window.ymaps.geocode(coords).then((res) => {
            const firstGeoObject = res.geoObjects.get(0);
            const address = firstGeoObject.getAddressLine();
            setSelectedAddress(address);
            setSearchQuery(address);
            // Set flag to prevent search results from showing
            setIsAddressSelected(true);
          });
        });

        // Save references
        yandexMapRef.current = map;
        placemarkerRef.current = null; // We've removed the placemark
        pointPlacemarkCollection.current = pointsCollection;
        map.geoObjects.add(pointsCollection);
        setIsMapInitialized(true);
      }
    });
  }, [isMapInitialized, initialMapCenter]);

  // Add Boxberry points to the map when they're loaded
  useEffect(() => {
    if (
      !isMapInitialized ||
      !yandexMapRef.current ||
      !pointPlacemarkCollection.current ||
      boxberryPoints.length === 0
    ) {
      return;
    }

    try {
      // Clear existing points
      pointPlacemarkCollection.current.removeAll();

      // Add new points to the collection
      let validPointsCount = 0;
      boxberryPoints.forEach((point) => {
        // Skip points without valid coordinates
        if (
          !point.coordinates ||
          !Array.isArray(point.coordinates) ||
          point.coordinates.length !== 2
        )
          return;

        try {
          const pointPlacemark = new window.ymaps.Placemark(
            point.coordinates,
            {
              // Balloon options (shown on click)
              balloonContentHeader: point.name,
              balloonContentBody: `
                <div class="boxberry-point">
                  <div><strong>Адрес:</strong> ${point.address}</div>
                  ${
                    point.metro
                      ? `<div><strong>Метро:</strong> ${point.metro}</div>`
                      : ""
                  }
                  ${
                    point.schedule
                      ? `<div><strong>Режим работы:</strong> ${point.schedule}</div>`
                      : ""
                  }
                  ${
                    point.phone
                      ? `<div><strong>Телефон:</strong> ${point.phone}</div>`
                      : ""
                  }
                </div>
              `,
              balloonContentFooter: `<button id="select-point-${point.id}" class="select-point-btn">Выбрать этот пункт</button>`,
              // Label on hover
              hintContent: point.name,
            },
            {
              preset: "islands#redDotIcon", // Use red dot icon for Boxberry points
            }
          );

          // Handle click on the point
          pointPlacemark.events.add("click", () => {
            setSelectedPoint(point);
          });

          pointPlacemarkCollection.current.add(pointPlacemark);
          validPointsCount++;
        } catch (pointError) {
          console.error(
            "Error adding placemark for point:",
            point.id,
            pointError
          );
        }
      });

      // Don't auto-center map when loading points - keep original center and zoom
      console.log("Points loaded, maintaining original map view");
    } catch (error) {
      console.error("Error adding points to map:", error);
    }
  }, [boxberryPoints, isMapInitialized]);

  // Load Yandex Maps script and initialize map
  useEffect(() => {
    if (!isOpen) return;

    const loadYandexMaps = () => {
      if (!API_KEY) {
        console.error("Missing VITE_YANDEX_MAPS_API_KEY environment variable");
        return;
      }

      // Check if script is already loaded
      let scriptElement = document.querySelector(
        'script[src*="api-maps.yandex.ru"]'
      );

      if (!scriptElement) {
        // Load Yandex Maps script if not already loaded
        scriptElement = document.createElement("script");
        scriptElement.src = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&lang=ru_RU`;
        scriptElement.async = true;
        scriptElement.onload = () => {
          // Initialize map after script is loaded
          initMap();
        };
        document.head.appendChild(scriptElement);
      } else if (window.ymaps) {
        // If the script is already loaded, just initialize the map
        initMap();
      }
    };

    // Give modal time to fully open before loading map
    const timer = setTimeout(loadYandexMaps, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, initMap]);

  // Clean up map instance when component unmounts or modal closes
  useEffect(() => {
    if (!isOpen && yandexMapRef.current) {
      // Destroy map when modal closes
      console.log("Destroying map instance");
      yandexMapRef.current.destroy();
      yandexMapRef.current = null;
      placemarkerRef.current = null;
      pointPlacemarkCollection.current = null;
      setIsMapInitialized(false);
    }
  }, [isOpen]);

  // Resize handler
  useEffect(() => {
    if (!mapRef.current || !isOpen || !yandexMapRef.current) return;

    const handleResize = () => {
      if (yandexMapRef.current) {
        yandexMapRef.current.container.fitToViewport();
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mapRef.current);

    // Also handle window resize
    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, isMapInitialized]);

  // Search for address
  const searchAddress = (query) => {
    if (!window.ymaps) return;
    window.ymaps.geocode(query).then((res) => {
      const results = [];
      res.geoObjects.each((obj) => {
        results.push({
          address: obj.getAddressLine(),
          coordinates: obj.geometry.getCoordinates(),
        });
      });
      setSearchResults(results);
    });
  };

  // Handle address selection from search results
  const handleAddressSelect = (result) => {
    if (!result || !result.coordinates) {
      console.error("Invalid result or missing coordinates:", result);
      return;
    }

    setSelectedAddress(result.address);
    setSearchQuery(result.address);
    setCoordinates(result.coordinates);
    setSearchResults([]);
    // Set flag to prevent search results from showing
    setIsAddressSelected(true);

    if (yandexMapRef.current) {
      try {
        yandexMapRef.current.setCenter(result.coordinates, 15);
        // No placemark to update
      } catch (error) {
        console.error("Error updating map with selected coordinates:", error);
      }
    }
  };

  // Find nearest Boxberry points based on selected coordinates
  const findNearestPoints = useCallback(() => {
    if (!coordinates || !window.ymaps) return;

    try {
      // Calculate distance from search point to each Boxberry point
      const pointsWithDistance = boxberryPoints.map((point) => {
        if (!point.coordinates) return { ...point, distance: Infinity };

        // Simple Euclidean distance (not perfect for geographic coordinates but works for sorting)
        const dx = coordinates[0] - point.coordinates[0];
        const dy = coordinates[1] - point.coordinates[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        return { ...point, distance };
      });

      // Sort by distance (closest first)
      const sortedPoints = pointsWithDistance
        .filter((point) => point.distance !== Infinity)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5); // Get top 5 closest points

      // Center map to show all nearby points
      if (sortedPoints.length > 0 && yandexMapRef.current) {
        try {
          // Create bounds object only if we have points to show
          if (sortedPoints.length > 0) {
            const bounds = new window.ymaps.GeoObjectCollection();

            // Add search point
            bounds.add(new window.ymaps.Placemark(coordinates));

            // Add nearest points
            let validPointsAdded = false;
            sortedPoints.forEach((point) => {
              if (
                point.coordinates &&
                Array.isArray(point.coordinates) &&
                point.coordinates.length === 2
              ) {
                bounds.add(new window.ymaps.Placemark(point.coordinates));
                validPointsAdded = true;
              }
            });

            // Only try to set bounds if we actually added valid points
            if (validPointsAdded) {
              const boundingBox = bounds.getBounds();
              if (
                boundingBox &&
                Array.isArray(boundingBox) &&
                boundingBox.length === 2
              ) {
                yandexMapRef.current.setBounds(boundingBox, {
                  checkZoomRange: true,
                  zoomMargin: 100,
                });
              } else {
                // Fallback if we couldn't get valid bounds
                yandexMapRef.current.setCenter(coordinates, 15);
              }
            } else {
              // Fallback if no valid points were added
              yandexMapRef.current.setCenter(coordinates, 15);
            }
          } else {
            // Fallback if no sorted points
            yandexMapRef.current.setCenter(coordinates, 15);
          }

          // Select the closest point
          if (sortedPoints[0]) {
            setSelectedPoint(sortedPoints[0]);
          }
        } catch (error) {
          console.error("Error setting map bounds:", error);
          // Fallback: just center on the search coordinates
          yandexMapRef.current.setCenter(coordinates, 15);
        }
      }
    } catch (error) {
      console.error("Error finding nearest points:", error);
    }
  }, [coordinates, boxberryPoints]);

  // Handle input change
  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
    // Reset the selected flag when user manually types
    setIsAddressSelected(false);
  };

  // When coordinates change, find nearest points
  useEffect(() => {
    if (coordinates && boxberryPoints.length > 0) {
      findNearestPoints();
    }
  }, [coordinates, boxberryPoints, findNearestPoints]);

  // Debounce search
  useEffect(() => {
    // Only perform search if user is actively typing (not after selection)
    if (isAddressSelected) {
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchAddress(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isAddressSelected]);

  // Handle selecting a Boxberry point
  const handleSelectPoint = (point) => {
    setSelectedPoint(point);
    // Center map on selected point
    if (yandexMapRef.current && point.coordinates) {
      yandexMapRef.current.setCenter(point.coordinates, 15);
    }
  };
  console.log("formData", formData);
  // Function to confirm selection
  const confirmSelection = () => {
    if (selectedPoint) {
      const address = selectedPoint.address;
      const index = address.split(",")[0];
      const city = address.split(",")[1].split(" ")[1]; // На случай разного формата адреса
      // Определение региона по городу
      console.log("city", city);
      const region = cityToRegionMap[city] || "-";

      setFormData((prev) => ({
        ...prev,
        city: city,
        region: region, // Теперь используем определенный регион
        index: index,
        street: address,
        house: "ПВЗ",
        apartment: selectedPoint.id,
      }));
      onSelectStore(selectedPoint);
      onClose();
    }
  };

  // Zoom to specific point when selected
  useEffect(() => {
    if (selectedPoint && selectedPoint.coordinates && yandexMapRef.current) {
      try {
        // Verify we have valid coordinates
        if (
          Array.isArray(selectedPoint.coordinates) &&
          selectedPoint.coordinates.length === 2 &&
          !isNaN(selectedPoint.coordinates[0]) &&
          !isNaN(selectedPoint.coordinates[1])
        ) {
          yandexMapRef.current.setCenter(selectedPoint.coordinates, 15);
        } else {
          console.warn(
            "Invalid coordinates for selected point:",
            selectedPoint
          );
        }
      } catch (error) {
        console.error("Error centering map on selected point:", error);
      }
    }
  }, [selectedPoint]);

  // Filter Boxberry points by city if formData.city is available
  useEffect(() => {
    if (formData?.city && boxberryPoints.length > 0) {
      // If we have a specific city, let's center the map on points in that city
      const cityPoints = boxberryPoints.filter(
        (point) =>
          point.city &&
          point.city.toLowerCase().includes(formData.city.toLowerCase())
      );

      if (cityPoints.length > 0 && yandexMapRef.current) {
        try {
          // Create bounds to fit all points from the city
          const bounds = new window.ymaps.GeoObjectCollection();
          let validPointsAdded = false;

          cityPoints.forEach((point) => {
            if (
              point.coordinates &&
              Array.isArray(point.coordinates) &&
              point.coordinates.length === 2
            ) {
              bounds.add(new window.ymaps.Placemark(point.coordinates));
              validPointsAdded = true;
            }
          });

          // Only try to set bounds if we added valid points
          if (validPointsAdded) {
            const boundingBox = bounds.getBounds();
            if (
              boundingBox &&
              Array.isArray(boundingBox) &&
              boundingBox.length === 2
            ) {
              yandexMapRef.current.setBounds(boundingBox, {
                checkZoomRange: true,
                zoomMargin: 50,
              });
            }
          }
        } catch (error) {
          console.error("Error setting bounds for city points:", error);
        }
      }
    }
  }, [formData?.city, boxberryPoints, isMapInitialized]);

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
        isOpen ? "block" : "hidden"
      }`}
    >
      <div className="bg-white rounded-lg w-full  h-[100vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <Link target="_blank" to={"https://boxberry.ru/"}>
            <img
              src="/img/logo_header_new.png"
              alt="Boxberry"
              className="h-8 mr-2"
            />
          </Link>

          <button
            onClick={() => {
              document.body.style.overflow = "auto";
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchQueryChange}
              placeholder="Введите адрес для поиска ближайших пунктов"
              className="w-full p-3 pl-10 border border-gray-300 rounded focus:outline-none focus:border-red-500"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            {!isAddressSelected && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-none"
                    onClick={() => handleAddressSelect(result)}
                  >
                    {result.address}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map container */}
        <div className="max-h-[1000px] overflow-y-auto">
          <div className="flex-1 overflow-hidden relative max-h-[400px]">
            <div
              ref={mapRef}
              className="w-full h-full"
              style={{
                minHeight: "400px",
                height: "100%",
              }}
            ></div>

            {isLoading && (
              <div className="absolute  inset-0 bg-white bg-opacity-70 flex flex-col items-center justify-center">
                <div className="text-lg font-medium">
                  Загрузка карты и пунктов выдачи...
                </div>
                <div className="loader"></div>
              </div>
            )}
          </div>

          {/* Selected point info */}
          {selectedPoint && (
            <div className="p-4 border-t bg-red-50">
              <div className="flex items-start">
                <MapPin
                  className="mr-2 text-red-600 mt-1 flex-shrink-0"
                  size={18}
                />
                {console.log("selectedPoint", selectedPoint)}
                <div className="flex-1 space-y-1">
                  <div className="font-medium">
                    {selectedPoint.name.split("_")[0]}
                  </div>
                  <div className="text-[12px] text-black/90">
                    {selectedPoint.address}
                  </div>
                  {selectedPoint.metro && (
                    <div className="text-[12px] text-black/90 ">
                      <span className="font-medium">Метро:</span>{" "}
                      {selectedPoint.metro}
                    </div>
                  )}
                  {selectedPoint.schedule && (
                    <div className="text-[12px] text-black/90">
                      <span className="font-medium">Режим работы:</span>{" "}
                      {selectedPoint.schedule}
                    </div>
                  )}
                  {selectedPoint.phone && (
                    <div className="text-[12px] text-black/90">
                      <span className="font-medium">Телефон:</span>{" "}
                      {selectedPoint.phone}
                    </div>
                  )}
                  {selectedPoint.tripdescription && (
                    <div className="text-[12px] text-black/90">
                      <span className="font-medium">Как найти:</span>{" "}
                      {selectedPoint.tripdescription}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Action buttons */}
        <div className="p-4 border-t flex justify-center gap-4">
          <button
            onClick={() => {
              confirmSelection();
              document.body.style.overflow = "auto";
            }}
            disabled={!selectedPoint}
            className={`px-4 py-2 rounded text-white text-sm ${
              selectedPoint
                ? "bg-primary hover:bg-primary/90"
                : "bg-primary/80 cursor-not-allowed"
            }`}
          >
            Выбрать этот пункт
          </button>
          <button
            onClick={() => {
              onClose();
              document.body.style.overflow = "auto";
            }}
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
