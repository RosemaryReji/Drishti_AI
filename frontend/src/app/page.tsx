"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Sun, CloudRain, Droplets, Wind, AlertTriangle, Play, Pause, 
  Map as MapIcon, Layers, Thermometer, Radio, Volume2, ShieldAlert, 
  Sparkles, Check, Globe, RefreshCw, ChevronRight, HelpCircle
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line 
} from "recharts";
import "maplibre-gl/dist/maplibre-gl.css";

// Interfaces for types
interface Panchayat {
  id: number;
  name: string;
  block: string;
  district: string;
  pincode: string;
  latitude: number;
  longitude: number;
  region_type: string;
}

interface ForecastPoint {
  time: string;
  temp: number;
  rain: number;
  humidity: number;
  windSpeed: number;
  aqi: number;
  uv: number;
}

interface Alert {
  id: number;
  title: string;
  location: string;
  risk_level: "SEVERE" | "MODERATE" | "LOW";
  message: string;
  timestamp: string;
}

// Client-side Mock Data Fallbacks
const MOCK_PANCHAYATS: Panchayat[] = [
  { id: 1, name: "Poonjar", block: "Erattupetta", district: "Kottayam", pincode: "686581", latitude: 9.682, longitude: 76.904, region_type: "mountain_monsoon" },
  { id: 2, name: "Meppadi", block: "Kalpetta", district: "Wayanad", pincode: "673577", latitude: 11.558, longitude: 76.128, region_type: "high_landslide" },
  { id: 3, name: "Mashobra", block: "Shimla Rural", district: "Shimla", pincode: "171007", latitude: 31.128, longitude: 77.228, region_type: "mountain_cold" },
  { id: 4, name: "DLF Phase 3", block: "Gurgaon", district: "Gurgaon", pincode: "122002", latitude: 28.489, longitude: 77.088, region_type: "urban_heatwave" },
  { id: 5, name: "Colaba", block: "Mumbai City", district: "Mumbai", pincode: "400005", latitude: 18.907, longitude: 72.815, region_type: "coastal_humid" }
];

const MOCK_ALERTS: Alert[] = [
  {
    id: 1,
    title: "Severe Landslide & Flash Flood Warning",
    location: "Meppadi (Wayanad District)",
    risk_level: "SEVERE",
    message: "Continuous heavy rainfall over 200mm expected. High risk of landslides in hilly terrains. Residents are advised to relocate to safe relief camps.",
    timestamp: "10 mins ago"
  },
  {
    id: 2,
    title: "Heatwave Orange Alert",
    location: "Gurgaon District",
    risk_level: "MODERATE",
    message: "Maximum temperatures expected to touch 45°C. Avoid outdoor exposure between 12 PM and 4 PM. Keep hydrated.",
    timestamp: "1 hr ago"
  },
  {
    id: 3,
    title: "Heavy Rain & High Tide Advisory",
    location: "Mumbai Coastal Areas",
    risk_level: "MODERATE",
    message: "Heavy monsoon showers coupled with a high tide of 4.5m expected. Avoid visiting coastal promenades. Fisherman advised not to venture into deep sea.",
    timestamp: "3 hrs ago"
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("forecast");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedVillage, setSelectedVillage] = useState<Panchayat>(MOCK_PANCHAYATS[0]);
  const [searchResults, setSearchResults] = useState<Panchayat[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [activeLayers, setActiveLayers] = useState({
    temperature: true,
    rainfall: false,
    wind: true,
    aqi: false,
    disaster: true
  });
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timelineIndex, setTimelineIndex] = useState<number>(3); // represents current index
  const [isApiHealthy, setIsApiHealthy] = useState<boolean | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [mouseCoords, setMouseCoords] = useState({ lat: 20.5937, lon: 78.9629 });
  const [language, setLanguage] = useState<string>("en");

  // New API & Map Click States
  const [forecastsList, setForecastsList] = useState<ForecastPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [predictions, setPredictions] = useState<any>(null);

  const clickPulseRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Workspace and MapLibre Refs
  const [workspace, setWorkspace] = useState<"satellite" | "agri" | "hazard">("satellite");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const markerElementsRef = useRef<Record<number, HTMLDivElement>>({});


  interface BackendForecast {
    id: number;
    panchayat_id: number;
    temperature: number;
    rainfall: number;
    humidity: number;
    wind_speed: number;
    wind_direction: number;
    aqi: number;
    uv_index: number;
    timestamp: string;
  }

  // Generate mock dynamic weather data points based on region & selected timeline index
  const generateMockForecastData = (type: string | undefined, lang: string): ForecastPoint[] => {
    const items = [];
    const baseHour = new Date();
    baseHour.setMinutes(0, 0, 0);

    for (let i = 0; i < 10; i++) {
      const timeVal = new Date(baseHour.getTime() + i * 24 * 60 * 60 * 1000);
      const dayLabel = timeVal.toLocaleDateString(lang, { weekday: "short" });
      
      let temp = 27;
      let rain = 0;
      let humidity = 75;
      let windSpeed = 15;
      let aqi = 45;
      let uv = 5;

      if (type === "mountain_monsoon") {
        temp = 24 + i % 3 + Math.sin(i) * 2;
        rain = Math.max(0, 8 + Math.cos(i) * 15 + (i === 3 ? 35 : 0)); // high rain peaks
        humidity = 90 + i % 4;
        windSpeed = 22 - i;
        aqi = 25 + i * 2;
        uv = 3 + i % 2;
      } else if (type === "high_landslide") {
        temp = 21 + Math.sin(i) * 1.5;
        rain = Math.max(0, 15 + Math.sin(i) * 30 + (i === 1 || i === 2 ? 65 : 0)); // landslide triggers
        humidity = 95 + i % 2;
        windSpeed = 25 + Math.cos(i) * 8;
        aqi = 15 + i;
        uv = 2;
      } else if (type === "mountain_cold") {
        temp = 12 + Math.cos(i) * 3;
        rain = Math.max(0, Math.sin(i) * 4);
        humidity = 60 + i % 3;
        windSpeed = 10 + i;
        aqi = 35 + i % 2;
        uv = 8;
      } else if (type === "urban_heatwave") {
        temp = 41 + Math.sin(i) * 3;
        rain = 0;
        humidity = 30 - i % 2;
        windSpeed = 14 + Math.sin(i) * 4;
        aqi = 240 + Math.cos(i) * 40; // severe pollution
        uv = 10;
      } else { // coastal_humid
        temp = 29 + Math.sin(i) * 1;
        rain = Math.max(0, 5 + Math.cos(i) * 10);
        humidity = 82 + i % 3;
        windSpeed = 24 + Math.sin(i) * 6;
        aqi = 50 + i * 3;
        uv = 6;
      }

      items.push({
        time: dayLabel,
        temp: parseFloat(temp.toFixed(1)),
        rain: parseFloat(rain.toFixed(1)),
        humidity: Math.round(humidity),
        windSpeed: parseFloat(windSpeed.toFixed(1)),
        aqi: Math.round(aqi),
        uv: uv
      });
    }
    return items;
  };

  // Get active forecast list (uses backend if loaded, else fallback to mock)
  const getForecastData = (): ForecastPoint[] => {
    if (forecastsList && forecastsList.length > 0) {
      return forecastsList;
    }
    return generateMockForecastData(selectedVillage.region_type, language);
  };

  // Translate basic text for multilingual capability
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        title: "Drishti AI",
        subtitle: "India's Climate Digital Twin",
        searchPlaceholder: "Search by Village Name or Pincode...",
        layersTitle: "Atmospheric Layers",
        temperature: "Temperature",
        rainfall: "Rainfall Overlay",
        wind: "Wind Streamlines",
        aqi: "Air Quality Index",
        disaster: "Climate Risks",
        alertHeader: "Active Warning Hub",
        advisoryHeader: "Agri-Drishti Decision Support",
        sowingWindow: "Sowing Window",
        pestRisk: "Pest Outbreak Risk",
        irrigationSchedule: "Irrigation Recommendation",
        readForecast: "Read Out Loud",
        playbackSpeed: "Forecast Playback",
        coordinates: "Geo-Coordinates",
        mapTwin: "Digital Twin Sandbox",
        connected: "API LIVE",
        disconnected: "LOCAL RUN"
      },
      hi: {
        title: "दृष्टि AI",
        subtitle: "भारत का जलवायु डिजिटल ट्विन",
        searchPlaceholder: "गांव का नाम या पिनकोड खोजें...",
        layersTitle: "वायुमंडलीय परतें",
        temperature: "तापमान",
        rainfall: "वर्षा का स्तर",
        wind: "हवा की धाराएं",
        aqi: "वायु गुणवत्ता सूचकांक",
        disaster: "जलवायु जोखिम",
        alertHeader: "सक्रिय चेतावनी केंद्र",
        advisoryHeader: "कृषि-दृष्टि निर्णय प्रणाली",
        sowingWindow: "बुवाई की अवधि",
        pestRisk: "कीट प्रकोप का खतरा",
        irrigationSchedule: "सिंचाई की सलाह",
        readForecast: "बोलकर सुनाएं",
        playbackSpeed: "पूर्वानुमान प्लेबैक",
        coordinates: "भू-स्थानिक निर्देशांक",
        mapTwin: "डिजिटल ट्विन सैंडबॉक्स",
        connected: "सर्वर सक्रिय",
        disconnected: "स्थानीय मोड"
      },
      ml: {
        title: "ദൃഷ്ടി AI",
        subtitle: "ഭാരതത്തിന്റെ കാലാവസ്ഥാ ഡിജിറ്റൽ ട്വിൻ",
        searchPlaceholder: "പഞ്ചായത്ത് അല്ലെങ്കിൽ പിൻകോഡ് തിരയുക...",
        layersTitle: "കാലാവസ്ഥാ പാളികൾ",
        temperature: "താപനില",
        rainfall: "മഴയുടെ അളവ്",
        wind: "കാറ്റിന്റെ ഗതി",
        aqi: "വായു ഗുണനിലവാരം",
        disaster: "കാലാവസ്ഥാ അപകടങ്ങൾ",
        alertHeader: "അപകട മുന്നറിയിപ്പുകൾ",
        advisoryHeader: "അഗ്രി-ദൃഷ്ടി കാർഷിക നിർദ്ദേശങ്ങൾ",
        sowingWindow: "വിത്ത് വിതയ്ക്കുന്ന സമയം",
        pestRisk: "കീടബാധ സാധ്യത",
        irrigationSchedule: "നനയ്ക്കൽ നിർദ്ദേശം",
        readForecast: "വായിച്ചു കേൾക്കുക",
        playbackSpeed: "കാലാവസ്ഥാ പ്ലേബാക്ക്",
        coordinates: "ഭൂമിശാസ്ത്ര നിർദ്ദേശാങ്കങ്ങൾ",
        mapTwin: "ഡിജിറ്റൽ മാപ്പ്",
        connected: "സർവർ സജീവം",
        disconnected: "ലോക്കൽ മോഡ്"
      }
    };
    return translations[language]?.[key] || translations["en"]?.[key] || key;
  };

  // Helper to format backend alerts into frontend structure
  const mapBackendAlert = (alert: any): Alert => {
    let relativeTime = "Just now";
    try {
      const alertTime = new Date(alert.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - alertTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffMins < 60) {
        relativeTime = diffMins <= 0 ? "Just now" : `${diffMins} mins ago`;
      } else if (diffHours < 24) {
        relativeTime = `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
      } else {
        relativeTime = alertTime.toLocaleDateString();
      }
    } catch (e) {
      relativeTime = "Recently";
    }
    
    return {
      id: alert.id,
      title: alert.title,
      location: alert.location,
      risk_level: alert.risk_level as "SEVERE" | "MODERATE" | "LOW",
      message: alert.message,
      timestamp: relativeTime
    };
  };

  // Helper to aggregate backend hourly forecasts into 10 daily ForecastPoints
  const aggregateBackendForecasts = (forecasts: BackendForecast[], lang: string): ForecastPoint[] => {
    if (!forecasts || forecasts.length === 0) return [];
    
    const dailyForecasts: ForecastPoint[] = [];
    const daysCount = Math.min(10, Math.ceil(forecasts.length / 24));
    
    for (let d = 0; d < daysCount; d++) {
      const dayHours = forecasts.slice(d * 24, (d + 1) * 24);
      if (dayHours.length === 0) continue;
      
      let tempSum = 0;
      let rainSum = 0;
      let humiditySum = 0;
      let windSum = 0;
      let aqiSum = 0;
      let uvMax = 0;
      
      dayHours.forEach(h => {
        tempSum += h.temperature;
        rainSum += h.rainfall;
        humiditySum += h.humidity;
        windSum += h.wind_speed;
        aqiSum += h.aqi;
        if (h.uv_index > uvMax) uvMax = h.uv_index;
      });
      
      const count = dayHours.length;
      const firstTimestamp = new Date(dayHours[0].timestamp);
      const dayLabel = firstTimestamp.toLocaleDateString(lang, { weekday: "short" });
      
      dailyForecasts.push({
        time: dayLabel,
        temp: parseFloat((tempSum / count).toFixed(1)),
        rain: parseFloat(rainSum.toFixed(1)),
        humidity: Math.round(humiditySum / count),
        windSpeed: parseFloat((windSum / count).toFixed(1)),
        aqi: Math.round(aqiSum / count),
        uv: uvMax
      });
    }
    
    return dailyForecasts;
  };

  // Check backend health
  useEffect(() => {
    fetch("http://localhost:8000/api/health")
      .then(res => res.json())
      .then(data => {
        if (data.status === "healthy") {
          setIsApiHealthy(true);
        } else {
          setIsApiHealthy(false);
        }
      })
      .catch(() => {
        setIsApiHealthy(false);
      });
  }, []);

  const getOfflinePredictions = (region: string) => {
    const basePredictions: Record<string, any> = {
      mountain_monsoon: {
        decadal_projections: { temp_anomaly: 1.8, rain_anomaly: 14.5, extreme_heat_days: 12 },
        monsoon_outlook: { onset_delay_days: 5, intensity_shift: "Highly concentrated intense spells with longer dry intervals", drought_risk_index: 0.35 },
        ai_analysis: `${selectedVillage.name} and the surrounding Kottayam highland belt are experiencing a severe shift toward extreme precipitation density. Decadal climate models indicate a 1.8°C rise in mean wet-bulb temperature, which expands atmospheric moisture capacity, triggering intense local cloudbursts and seasonal soil saturation anomalies.`
      },
      high_landslide: {
        decadal_projections: { temp_anomaly: 1.5, rain_anomaly: 22.0, extreme_heat_days: 8 },
        monsoon_outlook: { onset_delay_days: 7, intensity_shift: "Severe monsoonal bursts triggering localized slope failures", drought_risk_index: 0.20 },
        ai_analysis: `${selectedVillage.name} (Wayanad district) is situated in a high-risk slope instability zone. Decadal simulations forecast a 22% increase in extreme rainfall events. Under high soil moisture loading, landslide triggers become 3x more probable. Maintaining drainage corridors and preserving terraced slope vegetation are critical mitigations.`
      },
      mountain_cold: {
        decadal_projections: { temp_anomaly: 2.4, rain_anomaly: -8.5, extreme_heat_days: 15 },
        monsoon_outlook: { onset_delay_days: 10, intensity_shift: "Erratic winter precipitation and decreased snowfall accumulation", drought_risk_index: 0.65 },
        ai_analysis: `The Himalayan ecosystem surrounding ${selectedVillage.name} (Shimla) is warming at a rapid 2.4°C decadal rate. Winter frost cycles are projected to contract by 30%, disrupting apple crop vernalization needs and exacerbating early-summer agricultural drought due to accelerated glacial snowpack retreat.`
      },
      urban_heatwave: {
        decadal_projections: { temp_anomaly: 3.1, rain_anomaly: -12.0, extreme_heat_days: 28 },
        monsoon_outlook: { onset_delay_days: 12, intensity_shift: "Brief, violent convective thunderstorms; prolonged dry heat periods", drought_risk_index: 0.85 },
        ai_analysis: `${selectedVillage.name} (Gurgaon) exhibits intense micro-climate modification due to high concrete density. The decadal projection shows a 3.1°C urban heat island temperature anomaly, driving 28 additional severe heatwave days annually and compounding local groundwater exhaustion through excessive thermal demand.`
      },
      coastal_humid: {
        decadal_projections: { temp_anomaly: 2.0, rain_anomaly: 18.0, extreme_heat_days: 22 },
        monsoon_outlook: { onset_delay_days: 4, intensity_shift: "Increased tropical storm surges and extreme tidal precipitation", drought_risk_index: 0.30 },
        ai_analysis: `The coastal zone around ${selectedVillage.name} (Mumbai) faces compounding hazards from sea-level rise and high-tide storm surges. An 18% increase in extreme precipitation density is projected to overload urban drainage channels, raising municipal flood occurrences during combined spring tides and heavy monsoon spikes.`
      }
    };
    return basePredictions[region] || basePredictions.coastal_humid;
  };

  // Fetch forecast and alerts when selected village changes
  useEffect(() => {
    if (!selectedVillage) return;

    if (isApiHealthy) {
      setIsLoading(true);
      
      // Fetch 10-day hourly forecasts (240 hours)
      const fetchForecasts = fetch(`http://localhost:8000/api/forecasts/${selectedVillage.id}?days=10`)
        .then(res => {
          if (!res.ok) throw new Error("Forecast fetch failed");
          return res.json();
        })
        .then((data: BackendForecast[]) => {
          const aggregated = aggregateBackendForecasts(data, language);
          if (aggregated.length > 0) {
            setForecastsList(aggregated);
          } else {
            setForecastsList(generateMockForecastData(selectedVillage.region_type, language));
          }
        });

      // Fetch village specific alerts
      const fetchAlerts = fetch(`http://localhost:8000/api/alerts/village/${selectedVillage.id}`)
        .then(res => {
          if (!res.ok) throw new Error("Alerts fetch failed");
          return res.json();
        })
        .then((data: any[]) => {
          const mapped = data.map(mapBackendAlert);
          setAlerts(mapped);
        });

      // Fetch village predictions
      const fetchPredictions = fetch(`http://localhost:8000/api/forecasts/predictions/${selectedVillage.id}`)
        .then(res => {
          if (!res.ok) throw new Error("Predictions fetch failed");
          return res.json();
        })
        .then(data => {
          setPredictions(data);
        });

      Promise.all([fetchForecasts, fetchAlerts, fetchPredictions])
        .catch(err => {
          console.error("API error, falling back to mock:", err);
          setForecastsList(generateMockForecastData(selectedVillage.region_type, language));
          setAlerts(MOCK_ALERTS.filter(alert => 
            alert.location.toLowerCase().includes(selectedVillage.name.toLowerCase()) ||
            alert.location.toLowerCase().includes(selectedVillage.district.toLowerCase())
          ));
          setPredictions(getOfflinePredictions(selectedVillage.region_type));
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Offline fallback
      setForecastsList(generateMockForecastData(selectedVillage.region_type, language));
      setAlerts(MOCK_ALERTS.filter(alert => 
        alert.location.toLowerCase().includes(selectedVillage.name.toLowerCase()) ||
        alert.location.toLowerCase().includes(selectedVillage.district.toLowerCase())
      ));
      setPredictions(getOfflinePredictions(selectedVillage.region_type));
    }
  }, [selectedVillage, isApiHealthy, language]);

  // Update suggestions on search query change
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      if (isApiHealthy) {
        fetch(`http://localhost:8000/api/villages?query=${searchQuery}`)
          .then(res => res.json())
          .then((data: Panchayat[]) => {
            setSearchResults(data);
          })
          .catch(() => {
            fallbackSearch();
          });
      } else {
        fallbackSearch();
      }
    } else {
      setSearchResults([]);
    }

    function fallbackSearch() {
      const filtered = MOCK_PANCHAYATS.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pincode.includes(searchQuery) ||
        p.district.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    }
  }, [searchQuery, isApiHealthy]);

  // Handle Text to Speech
  const speakForecast = () => {
    if (!window.speechSynthesis) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const currentForecast = getForecastData()[timelineIndex];
    if (!currentForecast) return;
    let speechText = "";
    
    if (language === "hi") {
      speechText = `${selectedVillage.name} पंचायत में अभी तापमान ${currentForecast.temp} डिग्री सेल्सियस है। ${currentForecast.rain > 0 ? `यहाँ ${currentForecast.rain} मिलीमीटर वर्षा दर्ज की गई है।` : 'मौसम शुष्क बना हुआ है।'} वायु गुणवत्ता सूचकांक ${currentForecast.aqi} है।`;
    } else if (language === "ml") {
      speechText = `${selectedVillage.name} Panchayat-il nilavile thapanila ${currentForecast.temp} degree Celsius aanu. ${currentForecast.rain > 0 ? `${currentForecast.rain} millimeter mazha labhichittundu.` : 'mazhaykk sadhyatha illa.'} air quality index ${currentForecast.aqi} aanu.`;
    } else {
      speechText = `Weather forecast for ${selectedVillage.name} Panchayat. Currently, the temperature is ${currentForecast.temp} degrees Celsius, with humidity at ${currentForecast.humidity} percent. Wind speed is ${currentForecast.windSpeed} kilometers per hour. The air quality index is ${currentForecast.aqi}, which is ${currentForecast.aqi > 150 ? 'unhealthy' : 'moderate'}.`;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    
    const voices = window.speechSynthesis.getVoices();
    if (language === "hi") {
      const hiVoice = voices.find(v => v.lang.startsWith("hi"));
      if (hiVoice) utterance.voice = hiVoice;
    } else if (language === "ml") {
      const mlVoice = voices.find(v => v.lang.startsWith("ml"));
      if (mlVoice) utterance.voice = mlVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Cancel TTS on unmount or language change
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  // Handle timeline simulation auto-play
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setTimelineIndex(prev => (prev + 1) % 10);
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const currentForecast = getForecastData()[timelineIndex];
  const currentForecastRef = useRef<ForecastPoint | null>(null);

  useEffect(() => {
    currentForecastRef.current = currentForecast;
  }, [currentForecast]);

  // Initialize MapLibre Map
  useEffect(() => {
    let map: any;

    import("maplibre-gl").then((maplibreglModule) => {
      const maplibregl = maplibreglModule.default || maplibreglModule;
      if (!mapContainerRef.current) return;

      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            "esri-satellite": {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              ],
              tileSize: 256,
              attribution: "Tiles &copy; Esri"
            }
          },
          layers: [
            {
              id: "satellite-layer",
              type: "raster",
              source: "esri-satellite",
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [selectedVillage.longitude, selectedVillage.latitude],
        zoom: 5.0,
        projection: "globe"
      } as any);

      map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }));
      mapRef.current = map;

      map.on("load", () => {
        setIsMapLoaded(true);

        // Add weather overlays GeoJSON source
        map.addSource("weather-source", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: []
          }
        });

        // 1. Temperature Circle Layer
        map.addLayer({
          id: "temp-layer",
          type: "circle",
          source: "weather-source",
          paint: {
            "circle-radius": ["get", "tempRadius"],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "temp"],
              12, "#00e5ff",
              22, "#00d084",
              32, "#ffb300",
              42, "#ff4d4d"
            ],
            "circle-opacity": 0.4,
            "circle-blur": 0.85
          }
        });

        // 2. Rainfall Circle Layer
        map.addLayer({
          id: "rain-layer",
          type: "circle",
          source: "weather-source",
          paint: {
            "circle-radius": ["get", "rainRadius"],
            "circle-color": "#00e5ff",
            "circle-opacity": 0.35,
            "circle-blur": 0.65
          }
        });

        // 3. AQI Circle Layer
        map.addLayer({
          id: "aqi-layer",
          type: "circle",
          source: "weather-source",
          paint: {
            "circle-radius": ["get", "aqiRadius"],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "aqi"],
              50, "#00d084",
              100, "#ffb300",
              200, "#ff4d4d"
            ],
            "circle-opacity": 0.4,
            "circle-blur": 0.9
          }
        });

        // 4. Severe Alert Rings Layer
        map.addLayer({
          id: "severe-alert-layer",
          type: "circle",
          source: "weather-source",
          paint: {
            "circle-radius": ["get", "alertRadius"],
            "circle-color": "transparent",
            "circle-stroke-color": "#ff4d4d",
            "circle-stroke-width": 2,
            "circle-stroke-opacity": 0.75
          }
        });

        // Initialize MapLibre GL popup for hover summaries
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "custom-map-popup",
          maxWidth: "300px"
        });

        // Plot markers for seeded villages as interactive weather cards
        MOCK_PANCHAYATS.forEach((p) => {
          const el = document.createElement("div");
          el.className = "custom-map-marker flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border bg-space-blue-dark/95 text-white font-mono text-[10px] shadow-lg border-electric-cyan/35 hover:border-white transition backdrop-blur-md cursor-pointer select-none font-bold";
          el.style.transition = "all 0.2s ease";

          // Left condition icon
          const iconSpan = document.createElement("span");
          iconSpan.className = "weather-icon text-xs text-glow-cyan";
          iconSpan.textContent = "☀️";
          el.appendChild(iconSpan);

          // Middle village name
          const nameSpan = document.createElement("span");
          nameSpan.className = "weather-name tracking-tight";
          nameSpan.textContent = p.name;
          el.appendChild(nameSpan);

          // Right temperature value
          const tempSpan = document.createElement("span");
          tempSpan.className = "weather-temp px-1 bg-white/10 rounded font-bold text-glow-cyan";
          tempSpan.textContent = "27°C";
          el.appendChild(tempSpan);

          // Dynamic rainfall pill (optional, shown when raining)
          const rainSpan = document.createElement("span");
          rainSpan.className = "weather-rain-badge hidden px-1 bg-electric-cyan/20 text-electric-cyan rounded text-[8px] font-bold";
          rainSpan.textContent = "💧 0mm";
          el.appendChild(rainSpan);

          // Store DOM element reference
          markerElementsRef.current[p.id] = el;

          // Mouse Hover listeners for Popups
          el.addEventListener("mouseenter", () => {
            el.style.transform = "scale(1.05) translateY(-2px)";
            
            // Get forecast data for this village at the current timeline index
            let pTemp = 27;
            let pRain = 0;
            let pAqi = 45;
            let pRegion = p.region_type;

            if (p.id === selectedVillage.id && currentForecastRef.current) {
              pTemp = currentForecastRef.current.temp;
              pRain = currentForecastRef.current.rain;
              pAqi = currentForecastRef.current.aqi;
            } else {
              const mockData = generateMockForecastData(p.region_type, language)[timelineIndex];
              if (mockData) {
                pTemp = mockData.temp;
                pRain = mockData.rain;
                pAqi = mockData.aqi;
              }
            }

            const activeAlerts = alerts.filter(a => 
              a.location.toLowerCase().includes(p.name.toLowerCase()) ||
              a.location.toLowerCase().includes(p.district.toLowerCase())
            );
            const alertText = activeAlerts.length > 0 
              ? `<div style="color: #ff4d4d; font-weight: bold; margin-top: 4px;">⚠️ Warning: ${activeAlerts[0].title}</div>`
              : `<div style="color: #00d084; margin-top: 4px;">✓ Atmosphere Stable</div>`;

            const popupContent = `
              <div style="background-color: rgba(6, 17, 38, 0.95); border: 1px solid rgba(0, 229, 255, 0.35); padding: 8px 12px; font-family: monospace; font-size: 10px; color: #fff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); min-width: 150px; backdrop-filter: blur(10px);">
                <div style="font-weight: bold; color: #00e5ff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 4px;">${p.name} Panchayat</div>
                <div>Temperature: <strong>${pTemp}°C</strong></div>
                <div>Rainfall: <strong>${pRain} mm</strong></div>
                <div>Air Quality: <strong style="color: ${pAqi > 150 ? '#ff4d4d' : pAqi > 100 ? '#ffb300' : '#00d084'};">${pAqi} AQI</strong></div>
                <div>Region Type: <span style="color: #a0aec0; text-transform: capitalize;">${p.region_type.replace('_', ' ')}</span></div>
                ${alertText}
              </div>
            `;
            
            popup
              .setLngLat([p.longitude, p.latitude])
              .setHTML(popupContent)
              .addTo(map);
          });

          el.addEventListener("mouseleave", () => {
            el.style.transform = "scale(1)";
            popup.remove();
          });

          el.addEventListener("click", (evt) => {
            evt.stopPropagation();
            setSelectedVillage(p);
          });

          new maplibregl.Marker({ element: el })
            .setLngLat([p.longitude, p.latitude])
            .addTo(map);
        });

      });

      map.on("click", (evt: any) => {
        const { lng, lat } = evt.lngLat;
        clickPulseRef.current = { x: evt.point.x, y: evt.point.y, time: Date.now() };

        if (isApiHealthy) {
          fetch(`http://localhost:8000/api/villages/nearest?lat=${lat}&lon=${lng}&radius_km=300`)
            .then((res) => res.json())
            .then((data: Panchayat[]) => {
              if (data && data.length > 0) {
                setSelectedVillage(data[0]);
              } else {
                fallbackNearest(lat, lng);
              }
            })
            .catch(() => {
              fallbackNearest(lat, lng);
            });
        } else {
          fallbackNearest(lat, lng);
        }
      });

      map.on("mousemove", (evt: any) => {
        const { lat, lng } = evt.lngLat;
        setMouseCoords({ lat, lon: lng });
      });
    });

    return () => {
      if (map) map.remove();
    };
  }, [isApiHealthy]);

  const fallbackNearest = (lat: number, lon: number) => {
    let closest = MOCK_PANCHAYATS[0];
    let minDist = Infinity;
    
    MOCK_PANCHAYATS.forEach(p => {
      const dist = Math.pow(p.latitude - lat, 2) + Math.pow(p.longitude - lon, 2);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    });
    
    setSelectedVillage(closest);
  };

  // Camera Fly-To & GeoJSON Overlays update effect
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    const map = mapRef.current;
    
    // Fly camera smoothly to selected village
    map.flyTo({
      center: [selectedVillage.longitude, selectedVillage.latitude],
      zoom: 7.5,
      speed: 1.2,
      essential: true
    });

    // Compute GeoJSON points for active overlay metrics
    const features: any[] = [];
    
    MOCK_PANCHAYATS.forEach(p => {
      let pTemp = 27;
      let pRain = 0;
      let pAqi = 45;
      let hasSevereAlert = false;

      if (p.id === selectedVillage.id && currentForecast) {
        pTemp = currentForecast.temp;
        pRain = currentForecast.rain;
        pAqi = currentForecast.aqi;
      } else {
        const mockData = generateMockForecastData(p.region_type, language)[timelineIndex];
        if (mockData) {
          pTemp = mockData.temp;
          pRain = mockData.rain;
          pAqi = mockData.aqi;
        }
      }

      hasSevereAlert = alerts.some(a => 
        a.risk_level === "SEVERE" && 
        (a.location.includes(p.name) || p.district.includes(a.location))
      );

      // Update live weather data on map markers DOM elements
      const markerEl = markerElementsRef.current[p.id];
      if (markerEl) {
        let icon = "☀️";
        if (pRain > 30) {
          icon = "⛈️";
        } else if (pRain > 0) {
          icon = "🌧️";
        } else if (p.region_type === "mountain_cold") {
          icon = "❄️";
        } else if (p.region_type === "urban_heatwave" && pTemp > 38) {
          icon = "🔥";
        } else if (p.region_type === "coastal_humid") {
          icon = "🌦️";
        }

        let borderStyle = "1px solid rgba(255, 255, 255, 0.15)";
        let shadowStyle = "0 4px 6px rgba(0,0,0,0.3)";
        
        if (p.id === selectedVillage.id) {
          if (workspace === "agri") {
            borderStyle = "2px solid #00d084";
            shadowStyle = "0 0 15px rgba(0, 208, 132, 0.6)";
          } else if (workspace === "hazard") {
            borderStyle = "2px solid #ff4d4d";
            shadowStyle = "0 0 15px rgba(255, 77, 77, 0.6)";
          } else {
            borderStyle = "2px solid #00e5ff";
            shadowStyle = "0 0 15px rgba(0, 229, 255, 0.6)";
          }
          markerEl.style.transform = "scale(1.05)";
        } else {
          markerEl.style.transform = "scale(1)";
        }

        markerEl.style.border = borderStyle;
        markerEl.style.boxShadow = shadowStyle;

        const iconSpan = markerEl.querySelector(".weather-icon");
        if (iconSpan) iconSpan.textContent = icon;

        const tempSpan = markerEl.querySelector(".weather-temp");
        if (tempSpan) tempSpan.textContent = `${pTemp}°C`;

        const rainSpan = markerEl.querySelector(".weather-rain-badge") as HTMLSpanElement;
        if (rainSpan) {
          if (pRain > 0) {
            rainSpan.textContent = `💧 ${pRain}mm`;
            rainSpan.classList.remove("hidden");
          } else {
            rainSpan.classList.add("hidden");
          }
        }
      }

      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [p.longitude, p.latitude]
        },
        properties: {
          temp: pTemp,
          rain: pRain,
          aqi: pAqi,
          tempRadius: activeLayers.temperature ? Math.max(25, pTemp * 2.8) : 0,
          rainRadius: activeLayers.rainfall && pRain > 0 ? Math.min(120, 20 + pRain * 2.2) : 0,
          aqiRadius: activeLayers.aqi && pAqi > 100 ? Math.min(130, 25 + pAqi * 0.3) : 0,
          alertRadius: activeLayers.disaster && hasSevereAlert ? 45 : 0
        }
      });
    });

    const source = map.getSource("weather-source");
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: features
      });
    }
  }, [selectedVillage, isMapLoaded, currentForecast, activeLayers, alerts, timelineIndex, language, workspace]);


  // Get agricultural advisory based on region and weather
  const getAgriAdvisory = () => {
    const type = selectedVillage.region_type;
    const currentForecast = getForecastData()[timelineIndex];
    
    if (type === "high_landslide" || currentForecast.rain > 50) {
      return {
        sowing: "HOLD - High Landslides / Flood Danger",
        irrigation: "SUSPENDED - Natural precipitation exceeds saturation threshold",
        pest: "HIGH - Watch out for fungal decay & root rot due to logging water",
        notes: "Secure terraced field borders. Maintain clearance in catch drains."
      };
    } else if (type === "urban_heatwave" || currentForecast.temp > 40) {
      return {
        sowing: "DELAY - Seed germination compromised under extreme surface heat",
        irrigation: "CRITICAL - Water crops in early morning hours to limit evaporation loss",
        pest: "MODERATE - Red spider mites active in dry foliage",
        notes: "Deploy organic straw mulching to preserve soil moisture profiles."
      };
    } else if (type === "mountain_cold") {
      return {
        sowing: "OPTIMAL - Suitable for cold-hardy vegetables and winter wheat",
        irrigation: "MODERATE - Weekly scheduling sufficient",
        pest: "LOW - Natural frost conditions retard pest multiplication cycles",
        notes: "Provide windbreaks to protect young saplings from cold drafts."
      };
    } else {
      return {
        sowing: "OPTIMAL - Ideal moisture profile for sowing monsoon crops (Kharif)",
        irrigation: "OPTIONAL - Supplement only if dry spell exceeds 4 consecutive days",
        pest: "MODERATE - Monitor leaf folder pests in paddies",
        notes: "Apply recommended urea nitrogen doses after rainfall events."
      };
    }
  };

  const advisory = getAgriAdvisory();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* HEADER SECTION */}
      <header className="glass-panel border-b border-electric-cyan/20 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-electric-cyan/10 border border-electric-cyan/30 rounded-xl relative">
            <Radio className="w-6 h-6 text-electric-cyan animate-pulse" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-climate-green rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-glow-cyan text-white">{t("title")}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-electric-cyan/10 border border-electric-cyan/30 text-electric-cyan">
                v1.0 (MVP)
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">{t("subtitle")}</p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center flex-wrap justify-end gap-3 font-mono text-xs w-full md:w-auto">
          {/* Workspace Tabs Selector */}
          <div className="flex bg-space-blue-dark/85 border border-white/10 rounded-xl p-1 gap-1">
            <button 
              onClick={() => setWorkspace("satellite")}
              className={`px-3 py-1.5 rounded-lg hover:text-white transition flex items-center gap-1.5 ${
                workspace === "satellite" 
                  ? "bg-electric-cyan/20 text-electric-cyan border border-electric-cyan/35 font-bold" 
                  : "text-gray-400 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>SATELLITE TWIN</span>
            </button>
            <button 
              onClick={() => setWorkspace("agri")}
              className={`px-3 py-1.5 rounded-lg hover:text-white transition flex items-center gap-1.5 ${
                workspace === "agri" 
                  ? "bg-climate-green/20 text-climate-green border border-climate-green/35 font-bold" 
                  : "text-gray-400 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AGRI-DRISHTI</span>
            </button>
            <button 
              onClick={() => setWorkspace("hazard")}
              className={`px-3 py-1.5 rounded-lg hover:text-white transition flex items-center gap-1.5 ${
                workspace === "hazard" 
                  ? "bg-disaster-red/20 text-disaster-red border border-disaster-red/35 font-bold" 
                  : "text-gray-400 hover:bg-white/5 border border-transparent"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>HAZARD CONTROL</span>
            </button>
          </div>

          {/* API Health Status Indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
            isApiHealthy === true
              ? "bg-climate-green/10 border-climate-green text-climate-green"
              : "bg-warning-amber/10 border-warning-amber text-warning-amber"
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              isApiHealthy === true ? "bg-climate-green animate-pulse" : "bg-warning-amber"
            }`} />
            <span>{isApiHealthy === true ? t("connected") : t("disconnected")}</span>
          </div>

          {/* Language Selector */}
          <div className="flex bg-space-blue-light border border-electric-cyan/20 rounded-lg overflow-hidden">
            <button 
              onClick={() => setLanguage("en")} 
              className={`px-2.5 py-1.5 border-r border-electric-cyan/10 hover:text-white transition ${language === "en" ? "bg-electric-cyan/20 text-electric-cyan" : "text-gray-400"}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage("hi")} 
              className={`px-2.5 py-1.5 border-r border-electric-cyan/10 hover:text-white transition ${language === "hi" ? "bg-electric-cyan/20 text-electric-cyan" : "text-gray-400"}`}
            >
              हिन्दी
            </button>
            <button 
              onClick={() => setLanguage("ml")} 
              className={`px-2.5 py-1.5 hover:text-white transition ${language === "ml" ? "bg-electric-cyan/20 text-electric-cyan" : "text-gray-400"}`}
            >
              മലയാളം
            </button>
          </div>

          <a 
            href="http://localhost:8000/docs" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 bg-space-blue-light hover:bg-electric-cyan/10 border border-electric-cyan/20 rounded-lg text-gray-300 hover:text-electric-cyan transition"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>API Docs</span>
          </a>
        </div>
      </header>

      {/* DASHBOARD CONTENT GRID */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0">
        
        {/* LEFT COLUMN: CONTROL PANEL & MAP LAYERS (3/12 cols) */}
        <section className="glass-panel rounded-2xl p-4 flex flex-col gap-4 lg:col-span-3 min-h-0 overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Layers className="w-4 h-4 text-electric-cyan" />
            <h2 className="font-semibold text-white tracking-wide">{t("layersTitle")}</h2>
          </div>

          {/* Toggle Layer Cards */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveLayers(prev => ({ ...prev, temperature: !prev.temperature }))}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                activeLayers.temperature 
                  ? "bg-electric-cyan/15 border-electric-cyan/40 text-white" 
                  : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Thermometer className={`w-4 h-4 ${activeLayers.temperature ? "text-electric-cyan" : "text-gray-500"}`} />
                <span className="text-sm font-medium">{t("temperature")}</span>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${activeLayers.temperature ? "border-electric-cyan bg-electric-cyan" : "border-gray-600"}`}>
                {activeLayers.temperature && <Check className="w-3 h-3 text-space-blue-dark stroke-[3]" />}
              </div>
            </button>

            <button 
              onClick={() => setActiveLayers(prev => ({ ...prev, rainfall: !prev.rainfall }))}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                activeLayers.rainfall 
                  ? "bg-electric-cyan/15 border-electric-cyan/40 text-white" 
                  : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CloudRain className={`w-4 h-4 ${activeLayers.rainfall ? "text-electric-cyan" : "text-gray-500"}`} />
                <span className="text-sm font-medium">{t("rainfall")}</span>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${activeLayers.rainfall ? "border-electric-cyan bg-electric-cyan" : "border-gray-600"}`}>
                {activeLayers.rainfall && <Check className="w-3 h-3 text-space-blue-dark stroke-[3]" />}
              </div>
            </button>

            <button 
              onClick={() => setActiveLayers(prev => ({ ...prev, wind: !prev.wind }))}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                activeLayers.wind 
                  ? "bg-electric-cyan/15 border-electric-cyan/40 text-white" 
                  : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wind className={`w-4 h-4 ${activeLayers.wind ? "text-electric-cyan" : "text-gray-500"}`} />
                <span className="text-sm font-medium">{t("wind")}</span>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${activeLayers.wind ? "border-electric-cyan bg-electric-cyan" : "border-gray-600"}`}>
                {activeLayers.wind && <Check className="w-3 h-3 text-space-blue-dark stroke-[3]" />}
              </div>
            </button>

            <button 
              onClick={() => setActiveLayers(prev => ({ ...prev, aqi: !prev.aqi }))}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                activeLayers.aqi 
                  ? "bg-electric-cyan/15 border-electric-cyan/40 text-white" 
                  : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Droplets className={`w-4 h-4 ${activeLayers.aqi ? "text-electric-cyan" : "text-gray-500"}`} />
                <span className="text-sm font-medium">{t("aqi")}</span>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${activeLayers.aqi ? "border-electric-cyan bg-electric-cyan" : "border-gray-600"}`}>
                {activeLayers.aqi && <Check className="w-3 h-3 text-space-blue-dark stroke-[3]" />}
              </div>
            </button>

            <button 
              onClick={() => setActiveLayers(prev => ({ ...prev, disaster: !prev.disaster }))}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                activeLayers.disaster 
                  ? "bg-electric-cyan/15 border-electric-cyan/40 text-white" 
                  : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className={`w-4 h-4 ${activeLayers.disaster ? "text-disaster-red" : "text-gray-500"}`} />
                <span className="text-sm font-medium">{t("disaster")}</span>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${activeLayers.disaster ? "border-electric-cyan bg-electric-cyan" : "border-gray-600"}`}>
                {activeLayers.disaster && <Check className="w-3 h-3 text-space-blue-dark stroke-[3]" />}
              </div>
            </button>
          </div>

          {/* ACTIVE DISASTER WARNING LIST */}
          <div className="flex-1 flex flex-col gap-2 min-h-0 mt-2">
            <div className="flex items-center gap-2 border-b border-white/10 pb-1.5">
              <ShieldAlert className="w-4 h-4 text-disaster-red" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t("alertHeader")}</h3>
            </div>
            <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto min-h-0 pr-1">
              {alerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-xl flex flex-col gap-1.5 ${
                    alert.risk_level === "SEVERE" ? "glass-panel-alert" : "glass-panel-warning"
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      alert.risk_level === "SEVERE" ? "bg-disaster-red/20 text-disaster-red" : "bg-warning-amber/20 text-warning-amber"
                    }`}>
                      {alert.risk_level}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">{alert.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white leading-tight">{alert.title}</h4>
                  <p className="text-[10px] text-gray-300 leading-normal">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: DIGITAL TWIN GLOBE/MAP VIEWPORT (5/12 cols) */}
        <section className="glass-panel rounded-2xl p-2 flex flex-col gap-2 lg:col-span-5 min-h-[380px] lg:min-h-0">
          {/* Viewport Header */}
          <div className="flex justify-between items-center px-2 py-1 border-b border-white/5 shrink-0 font-mono text-[10px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5 text-electric-cyan" />
              <span>{t("mapTwin")}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{t("coordinates")}: <span className="text-electric-cyan font-bold">{mouseCoords.lat.toFixed(4)}N, {mouseCoords.lon.toFixed(4)}E</span></span>
            </div>
          </div>

          {/* Interactive Simulation Map Sandbox */}
          <div className="flex-1 relative rounded-xl overflow-hidden bg-space-blue-dark border border-white/5">
            {/* The MapLibre Container */}
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

            {/* Scientific HUD Stats Overlay */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 font-mono text-[9px] text-gray-400 pointer-events-none bg-space-blue-dark/80 p-2 rounded border border-white/10 backdrop-blur z-10">
              <div className="text-white font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-electric-cyan" />
                <span>ATMOSPHERE DATA STREAM</span>
              </div>
              <div>STORM INDEX: <span className="text-disaster-red">SEVERE</span></div>
              <div>SAT FREQ: INSAT-3DR [18.2 GHz]</div>
              <div>GRID confidence: 96.43%</div>
            </div>

            {/* India Simulation Details Toast */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none bg-space-blue-dark/80 px-2 py-1.5 rounded border border-white/10 backdrop-blur z-10 text-[9px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-electric-cyan animate-ping" />
              <span className="text-white">SIM TIME: D+{timelineIndex} [{currentForecast.time}]</span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: VILLAGE SEARCH, ADVANCED FORECAST, ADVISORIES (4/12 cols) */}
        <section className="glass-panel rounded-2xl p-4 flex flex-col gap-4 lg:col-span-4 min-h-0 overflow-y-auto">
          {/* SEARCH BOX */}
          <div className="relative shrink-0">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-space-blue-light/50 border border-electric-cyan/20 focus:border-electric-cyan hover:border-electric-cyan/40 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-400 glow-border-cyan transition"
            />
            {/* Search Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-space-blue-light border border-electric-cyan/30 rounded-xl shadow-2xl overflow-hidden z-20 font-mono text-xs">
                {searchResults.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => {
                      setSelectedVillage(p);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="w-full px-4 py-2.5 text-left border-b border-white/5 hover:bg-electric-cyan/15 text-gray-300 hover:text-white transition flex items-center justify-between"
                  >
                    <span>{p.name} ({p.district}, {p.pincode})</span>
                    <span className="text-[10px] text-electric-cyan">{p.latitude.toFixed(2)}N, {p.longitude.toFixed(2)}E</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ACTIVE PANCHAYAT REPORT */}
          <div className="flex flex-col gap-3 relative min-h-[160px]">
            {isLoading && (
              <div className="absolute inset-0 bg-space-blue-dark/75 backdrop-blur-sm rounded-xl flex flex-col gap-2 items-center justify-center z-10 border border-electric-cyan/20">
                <RefreshCw className="w-5 h-5 text-electric-cyan animate-spin" />
                <span className="font-mono text-[9px] text-electric-cyan tracking-widest uppercase animate-pulse">DOWNLINKING DATA STREAM...</span>
              </div>
            )}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight leading-none">{selectedVillage.name}</h2>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {selectedVillage.block} Block, {selectedVillage.district} District • {selectedVillage.pincode}
                </p>
              </div>

              {/* TTS Button */}
              <button 
                onClick={speakForecast}
                className={`p-2 rounded-lg border transition ${
                  isSpeaking 
                    ? "bg-electric-cyan/20 border-electric-cyan text-electric-cyan animate-pulse" 
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
                title={t("readForecast")}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 uppercase">{t("temperature")}</span>
                <span className="text-lg font-bold text-white">{currentForecast.temp}°C</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 uppercase">Rainfall</span>
                <span className="text-lg font-bold text-electric-cyan">{currentForecast.rain} mm</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 uppercase">Humidity</span>
                <span className="text-lg font-bold text-white">{currentForecast.humidity}%</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 uppercase">Air Quality (AQI)</span>
                <span className={`text-lg font-bold ${
                  currentForecast.aqi > 150 ? "text-disaster-red" : currentForecast.aqi > 100 ? "text-warning-amber" : "text-climate-green"
                }`}>{currentForecast.aqi}</span>
              </div>
            </div>
          </div>

          {/* ADVANCED CHARTS PANEL */}
          <div className="flex flex-col gap-2">
            {/* Tabs */}
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 text-[10px] uppercase font-mono font-bold tracking-wider shrink-0">
              <button 
                onClick={() => setActiveTab("forecast")}
                className={`flex-1 py-1.5 rounded text-center transition ${activeTab === "forecast" ? "bg-electric-cyan/20 text-electric-cyan" : "text-gray-400"}`}
              >
                10-Day Temp Outlook
              </button>
              <button 
                onClick={() => setActiveTab("rain")}
                className={`flex-1 py-1.5 rounded text-center transition ${activeTab === "rain" ? "bg-electric-cyan/20 text-electric-cyan" : "text-gray-400"}`}
              >
                Precipitation Trend
              </button>
            </div>

            {/* Charts View */}
            <div className="h-[140px] w-full font-mono text-[9px]">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === "forecast" ? (
                  <AreaChart data={getForecastData()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" />
                    <YAxis stroke="rgba(255,255,255,0.4)" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(3, 12, 27, 0.95)', borderColor: 'rgba(0, 229, 255, 0.25)', color: '#fff' }} />
                    <Area type="monotone" dataKey="temp" name="Temp (°C)" stroke="#00e5ff" strokeWidth={1.5} fillOpacity={1} fill="url(#colorTemp)" />
                  </AreaChart>
                ) : (
                  <AreaChart data={getForecastData()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D084" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00D084" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" />
                    <YAxis stroke="rgba(255,255,255,0.4)" domain={[0, 'dataMax + 10']} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(3, 12, 27, 0.95)', borderColor: 'rgba(0, 220, 132, 0.25)', color: '#fff' }} />
                    <Area type="monotone" dataKey="rain" name="Rain (mm)" stroke="#00D084" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRain)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* WORKSPACE ADAPTIVE PREDICTIONS / ADVISORIES */}
          {workspace === "satellite" && predictions && (
            <div className="flex-1 flex flex-col gap-2 min-h-0 bg-white/5 border border-electric-cyan/20 p-3.5 rounded-xl">
              <div className="flex items-center gap-2 border-b border-white/10 pb-1.5 shrink-0">
                <Globe className="w-4 h-4 text-electric-cyan animate-pulse" />
                <h3 className="text-xs font-semibold text-white tracking-wide">AI Climate Change Predictor</h3>
              </div>
              
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto text-[11px] leading-relaxed pr-1">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col text-center">
                    <span className="font-mono text-[8px] text-gray-400 uppercase">Decadal Temp</span>
                    <span className="font-bold text-white text-xs mt-0.5">+{predictions.decadal_projections?.temp_anomaly}°C</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col text-center">
                    <span className="font-mono text-[8px] text-gray-400 uppercase">Decadal Rain</span>
                    <span className="font-bold text-electric-cyan text-xs mt-0.5">{predictions.decadal_projections?.rain_anomaly > 0 ? '+' : ''}{predictions.decadal_projections?.rain_anomaly}%</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col text-center">
                    <span className="font-mono text-[8px] text-gray-400 uppercase">Extra Heat Days</span>
                    <span className="font-bold text-warning-amber text-xs mt-0.5">+{predictions.decadal_projections?.extreme_heat_days} d/y</span>
                  </div>
                </div>

                <div className="flex flex-col border-t border-white/5 pt-2">
                  <span className="font-mono text-[9px] uppercase text-gray-400">Monsoon Outlook</span>
                  <span className="font-semibold text-white mt-0.5">Onset Delay: {predictions.monsoon_outlook?.onset_delay_days} Days</span>
                  <p className="text-gray-300 mt-0.5">{predictions.monsoon_outlook?.intensity_shift}</p>
                </div>

                <div className="flex flex-col border-t border-white/5 pt-2">
                  <span className="font-mono text-[9px] uppercase text-gray-400">Drought Index Risk</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${predictions.monsoon_outlook?.drought_risk_index > 0.6 ? 'bg-disaster-red' : predictions.monsoon_outlook?.drought_risk_index > 0.3 ? 'bg-warning-amber' : 'bg-climate-green'}`} 
                        style={{ width: `${predictions.monsoon_outlook?.drought_risk_index * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-white">{(predictions.monsoon_outlook?.drought_risk_index * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="flex flex-col border-t border-white/5 pt-2 mt-1">
                  <span className="font-mono text-[9px] uppercase text-gray-400">AI Environmental Analysis</span>
                  <p className="text-gray-300 italic mt-0.5">{predictions.ai_analysis}</p>
                </div>
              </div>
            </div>
          )}

          {workspace === "agri" && (
            <div className="flex-1 flex flex-col gap-2 min-h-0 bg-white/5 border border-climate-green/20 p-3.5 rounded-xl">
              <div className="flex items-center gap-2 border-b border-white/10 pb-1.5 shrink-0">
                <Sparkles className="w-4 h-4 text-climate-green animate-pulse" />
                <h3 className="text-xs font-semibold text-white tracking-wide">{t("advisoryHeader")}</h3>
              </div>
              
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto text-[11px] leading-relaxed pr-1">
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] uppercase text-gray-400">{t("sowingWindow")}</span>
                  <span className="font-semibold text-white flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${advisory.sowing.includes("HOLD") ? "bg-disaster-red" : "bg-climate-green"}`} />
                    {advisory.sowing}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] uppercase text-gray-400">{t("irrigationSchedule")}</span>
                  <span className="text-gray-200 mt-0.5">{advisory.irrigation}</span>
                </div>
                <div className="flex flex-col border-b border-white/5 pb-2">
                  <span className="font-mono text-[9px] uppercase text-gray-400">{t("pestRisk")}</span>
                  <span className="text-gray-200 mt-0.5">{advisory.pest}</span>
                </div>

                {/* Crop & Soil Suitability Indexes */}
                <div className="flex flex-col pt-1">
                  <span className="font-mono text-[9px] uppercase text-gray-400">Predictive Crop Suitability</span>
                  <div className="grid grid-cols-2 gap-2 mt-1.5 font-mono text-[10px]">
                    <div className="bg-white/5 p-1.5 rounded border border-white/5 flex justify-between">
                      <span className="text-gray-400">Rice:</span>
                      <span className="font-bold text-climate-green">
                        {selectedVillage.region_type === "urban_heatwave" ? "12%" : selectedVillage.region_type === "mountain_cold" ? "35%" : "94%"}
                      </span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded border border-white/5 flex justify-between">
                      <span className="text-gray-400">Wheat:</span>
                      <span className="font-bold text-climate-green">
                        {selectedVillage.region_type === "urban_heatwave" ? "42%" : selectedVillage.region_type === "mountain_cold" ? "88%" : "55%"}
                      </span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded border border-white/5 flex justify-between">
                      <span className="text-gray-400">Millets:</span>
                      <span className="font-bold text-climate-green">
                        {selectedVillage.region_type === "urban_heatwave" ? "92%" : "70%"}
                      </span>
                    </div>
                    <div className="bg-white/5 p-1.5 rounded border border-white/5 flex justify-between">
                      <span className="text-gray-400">Apples:</span>
                      <span className="font-bold text-climate-green">
                        {selectedVillage.region_type === "mountain_cold" ? "95%" : "0%"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col border-t border-white/5 pt-2">
                  <span className="font-mono text-[9px] uppercase text-gray-400">Soil Moisture Depletion Rate</span>
                  <span className="text-white font-semibold mt-0.5">
                    {selectedVillage.region_type === "urban_heatwave" ? "CRITICAL (-4.2%/day)" : selectedVillage.region_type === "mountain_cold" ? "LOW (-0.8%/day)" : "OPTIMAL (-1.5%/day)"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {workspace === "hazard" && (
            <div className="flex-1 flex flex-col gap-2 min-h-0 bg-white/5 border border-disaster-red/20 p-3.5 rounded-xl">
              <div className="flex items-center gap-2 border-b border-white/10 pb-1.5 shrink-0">
                <AlertTriangle className="w-4 h-4 text-disaster-red animate-pulse" />
                <h3 className="text-xs font-semibold text-white tracking-wide">Predictive Early Warning HUD</h3>
              </div>
              
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto text-[11px] leading-relaxed pr-1">
                {/* Risk Indexes */}
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] uppercase text-gray-400">Landslide/Flash Flood Probability</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-disaster-red" 
                        style={{ 
                          width: `${selectedVillage.region_type === "high_landslide" ? 88 : selectedVillage.region_type === "mountain_monsoon" ? 65 : selectedVillage.region_type === "coastal_humid" ? 45 : 10}%` 
                        }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-white">
                      {selectedVillage.region_type === "high_landslide" ? "88%" : selectedVillage.region_type === "mountain_monsoon" ? "65%" : selectedVillage.region_type === "coastal_humid" ? "45%" : "10%"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col border-t border-white/5 pt-2">
                  <span className="font-mono text-[9px] uppercase text-gray-400">Extreme Heatwave Index</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-warning-amber" 
                        style={{ 
                          width: `${selectedVillage.region_type === "urban_heatwave" ? 92 : selectedVillage.region_type === "coastal_humid" ? 60 : 30}%` 
                        }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-white">
                      {selectedVillage.region_type === "urban_heatwave" ? "92%" : selectedVillage.region_type === "coastal_humid" ? "60%" : "30%"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col border-t border-white/5 pt-2">
                  <span className="font-mono text-[9px] uppercase text-gray-400">Safety Index Rating</span>
                  <span className={`font-semibold text-xs mt-0.5 ${
                    selectedVillage.region_type === "high_landslide" ? "text-disaster-red" : selectedVillage.region_type === "urban_heatwave" ? "text-warning-amber" : "text-climate-green"
                  }`}>
                    {selectedVillage.region_type === "high_landslide" ? "⚠️ CRITICAL HAZARD LAYER" : selectedVillage.region_type === "urban_heatwave" ? "🟠 MODERATE MONITORING REQUIRED" : "🟢 STABLE / SATISFACTORY"}
                  </span>
                </div>

                <div className="flex flex-col border-t border-white/5 pt-2">
                  <span className="font-mono text-[9px] uppercase text-gray-400">Suggested Action Protocol</span>
                  <p className="text-gray-300 font-semibold mt-0.5">
                    {selectedVillage.region_type === "high_landslide" 
                      ? "Establish high drainage routes. Relocate families from low gradient margins." 
                      : selectedVillage.region_type === "urban_heatwave" 
                        ? "Ensure grid capacity. Shut down municipal work outdoors from 1-4 PM." 
                        : "No immediate emergency action required. Maintain general vigilance."
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

        </section>
      </main>

      {/* BOTTOM SECTION: TIMELINE SIMULATION ROADMAP CONTROL */}
      <footer className="glass-panel border-t border-electric-cyan/20 px-6 py-4 flex flex-col md:flex-row items-center gap-4 z-10 shrink-0 select-none">
        
        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 bg-electric-cyan hover:bg-electric-cyan/85 border border-electric-cyan rounded-full text-space-blue-dark transition"
            title={isPlaying ? "Pause Simulation" : "Start Timeline Playback"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-space-blue-dark text-space-blue-dark" /> : <Play className="w-4 h-4 fill-space-blue-dark text-space-blue-dark ml-0.5" />}
          </button>
          
          <div className="flex flex-col font-mono text-xs">
            <span className="text-white font-bold leading-none">{t("playbackSpeed")}</span>
            <span className="text-[10px] text-gray-400 mt-1 uppercase">Interval: Daily Playback</span>
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 flex items-center gap-3 w-full">
          <span className="font-mono text-[10px] text-gray-400 uppercase">D-1</span>
          
          <div className="flex-1 relative flex items-center">
            <input 
              type="range" 
              min="0" 
              max="9" 
              value={timelineIndex}
              onChange={(e) => {
                setTimelineIndex(parseInt(e.target.value));
                setIsPlaying(false); // Stop autoplay when scrubbed manually
              }}
              className="w-full h-1.5 bg-space-blue-light border border-white/10 rounded-lg appearance-none cursor-pointer accent-electric-cyan focus:outline-none"
            />
            
            {/* Tick indicators */}
            <div className="absolute left-0 right-0 top-4 flex justify-between px-1 pointer-events-none font-mono text-[9px] text-gray-500">
              {getForecastData().map((f, idx) => (
                <span 
                  key={idx} 
                  className={`transition ${idx === timelineIndex ? "text-electric-cyan font-bold" : ""}`}
                >
                  {f.time}
                </span>
              ))}
            </div>
          </div>

          <span className="font-mono text-[10px] text-gray-400 uppercase">D+9</span>
        </div>
      </footer>
    </div>
  );
}
