import { useState, useEffect } from "react";
import "./App.css";
import WeatherScene from "./WeatherScene";
function App() {
  const API_KEY = "0040c11494d2aecd3076cfda38e058e6"; // <- Replace with new key

  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history")) || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================================
  // AUTO DETECT LOCATION ON LOAD
  // ================================
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        fetchByCoords(latitude, longitude);
      },
      () => {
        console.log("Location permission denied");
      }
    );
  }, []);

  // ================================
  // FETCH WEATHER BY CITY
  // ================================
  const fetchWeather = async (cityName = city) => {
    const cleanCity = cityName.trim();
    if (!cleanCity) return;

    setLoading(true);
    setError("");
    setWeather(null);
    setForecast([]);

    try {
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cleanCity}&units=metric&appid=${API_KEY}`
      );

      const currentData = await currentRes.json();

      if (currentData.cod !== 200) {
        throw new Error(currentData.message);
      }

      setWeather(currentData);

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cleanCity}&units=metric&appid=${API_KEY}`
      );

      const forecastData = await forecastRes.json();

      const daily = forecastData.list.filter((_, i) => i % 8 === 0);
      setForecast(daily);

      const updatedHistory = [...new Set([cleanCity, ...history])].slice(0, 5);
      setHistory(updatedHistory);
      localStorage.setItem("history", JSON.stringify(updatedHistory));
    } catch (err) {
      setError("invalid");
    }

    setLoading(false);
  };

  // ================================
  // FETCH BY COORDINATES
  // ================================
  const fetchByCoords = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );

      const data = await res.json();

      if (data.cod !== 200) return;

      setWeather(data);
    } catch (err) {
      console.log(err);
    }
  };

  // ================================
  // DYNAMIC BACKGROUND CLASS
  // ================================
  const getBackgroundClass = () => {
    if (!weather?.main?.temp) return "mild";
    if (weather.main.temp > 25) return "hot";
    if (weather.main.temp < 10) return "cold";
    return "mild";
  };
  const getCityBackground = () => {
    if (!weather?.name) return "";

    return `https://source.unsplash.com/1600x900/?${weather.name},city,landscape`;
  };
  const getVisualMode = (weather) => {
    if (!weather) return "neutral";

    const condition = weather.weather[0].main;
    const temp = weather.main.temp;

    if (condition === "Thunderstorm") return "storm";
    if (condition === "Rain") return "rain";
    if (condition === "Clouds") return "cloudy";

    if (temp <= 8) return "cold";
    if (temp >= 30) return "hot";

    return "mild";
  };
  
  return (
    <div className={`app ${getVisualMode(weather)}`}>

      <div className="background-layer"></div>
        {weather && (
          <Atmosphere condition={weather.weather[0].main} />
        )}
      <div className="navbar">
            <div className="brand">Atmos</div>
          </div>

      {weather && <WeatherScene weather={weather} />}
      <div className="content">

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchWeather()}
          />
          <button className="search-btn">Search</button>
        </div>
        {error && (
          <p className="error-message">
            Check spelling of the city
          </p>
        )}
        {weather && (
        <div className="glass-card">
          <div className="hero">
            <h1 className="city">{weather.name}</h1>
            <h2 className="temperature">{Math.round(weather.main.temp)}°</h2>
            <p className="condition">
              {weather.weather[0].description}
            </p>
          </div>
        </div>
      )}

        {forecast.length > 0 && (
          <div className="forecast-row">
            {forecast.map((day, i) => (
              <div key={i} className="forecast-card">
                <p>{new Date(day.dt * 1000).toLocaleDateString()}</p>
                <img
                  src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                  alt=""
                />
                <p>{Math.round(day.main.temp)}°</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
function Atmosphere({ condition }) {

  switch (condition) {
    case "Rain":
    case "Drizzle":
      return <div className="atmos rain"></div>;

    case "Thunderstorm":
      return <div className="atmos storm"></div>;

    case "Snow":
      return <div className="atmos snow"></div>;

    case "Clouds":
      return <div className="atmos clouds"></div>;

    case "Mist":
    case "Fog":
    case "Haze":
      return <div className="atmos fog"></div>;

    case "Smoke":
    case "Dust":
    case "Sand":
    case "Ash":
      return <div className="atmos dust"></div>;

    case "Squall":
    case "Tornado":
      return <div className="atmos wind"></div>;

    case "Clear":
    default:
      return <div className="atmos clear"></div>;
  }
}

export default App;