import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue with Webpack/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const DormitoryMap = ({ dormitories, selectedDormitory, mapCenter, mapZoom, onMarkerClick }) => {
  const mapRef = useRef();

  const getDormitoryCoords = (dormitory) => {
    if (!dormitory || !dormitory.address) {
      console.warn(`[DormitoryMap] No address for dormitory ID: ${dormitory?.id}, Name: ${dormitory?.name}`);
      return null;
    }

    const address = dormitory.address.toLowerCase();
    // Приклади відомих адрес (можна розширити або замінити на геокодування/БД)
    const knownAddresses = {
      "вул. студентська, 1, київ": { lat: 50.4510, lng: 30.4700 }, // Гуртожиток №1
      "просп. перемоги, 37, київ": { lat: 50.4505, lng: 30.4590 }, // Гуртожиток №2
      // Оновлені координати для Гуртожитку №10 НУБіП (якщо адреса збігається)
      "вулиця горіхуватський шлях, 7a, київ, 03041": { lat: 50.38583017436447, lng: 30.511714428256834 },
      // Додайте сюди інші відомі адреси та їх координати
    };

    const normalizedAddress = address.replace(/, /g, ',').trim(); // Нормалізуємо для кращого співпадіння

    if (knownAddresses[normalizedAddress]) {
      return knownAddresses[normalizedAddress];
    }

    // Спроба знайти адресу, яка містить ключові частини
    for (const key in knownAddresses) {
      // Порівняння за першою частиною адреси (назва вулиці) або іншими ключовими словами
      if (normalizedAddress.includes(key.split(',')[0]) || normalizedAddress.includes("горіхуватський шлях, 7a")) {
        return knownAddresses[key];
      }
    }
    
    // Fallback: Спроба витягнути координати, якщо вони вказані в адресі (малоймовірно, але як приклад)
    const latLngMatch = address.match(/(\d{2}\.\d+)[,\s]+(\d{2}\.\d+)/);
    if (latLngMatch && latLngMatch.length === 3) {
      const lat = parseFloat(latLngMatch[1]);
      const lng = parseFloat(latLngMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    console.warn(`[DormitoryMap] Coordinates not found for address: "${dormitory.address}" (Dormitory ID: ${dormitory.id})`);
    return null;
  };

  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lng]}
      zoom={mapZoom}
      style={{ height: '100%', width: '100%', borderRadius: 'var(--border-radius-lg)' }}
      ref={mapRef}
      scrollWheelZoom={true} // Дозволяє масштабування колесом миші
    >
      <ChangeView center={mapCenter} zoom={mapZoom} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {dormitories.map((dorm) => {
        const position = getDormitoryCoords(dorm);
        if (!position) return null; // Не рендеримо маркер, якщо координати не знайдено

        return (
          <Marker
            key={dorm.id}
            position={[position.lat, position.lng]}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(dorm); // Викликаємо колбек при кліку на маркер
                }
              },
            }}
          >
            <Popup>
              <strong>{dorm.name}</strong><br />
              {dorm.address}<br />
              {dorm.capacity && `Місткість: ${dorm.capacity} осіб`}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default DormitoryMap;