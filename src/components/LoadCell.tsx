import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  BarElement,
  BarController,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  BarElement,
  BarController
);

interface SensorData {
  [key: string]: { timestamps: string[]; values: number[] };
}

const LoadCell: React.FC = () => {
  const [loadCellData, setLoadCellData] = useState<SensorData>({});
  const [weatherStationRawData, setWeatherStationRawData] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const API_URL = "http://100.78.31.68:2612/azp"; // Update with actual API URL
  const API_KEY = "azp-261211102024-aquadrox"; // API Key

  const parseNMEAData = (rawData: string[]) => {
    console.log("Raw Data : ", rawData);

    const parsedData: { [key: string]: any } = {
      windSpeed: [],
      windDirection: [],
      pressure: [],
      temperature: [],
      humidity: [],
      timestamps: [],
    };

    rawData.forEach((sentenceGroup) => {
      const sentences = sentenceGroup.split("$").filter((s) => s).map((s) => "$" + s);

      sentences.forEach((sentence) => {
        const parts = sentence.split(",");

        if (parts[0] === "$WIMWV") {
          const direction = parseFloat(parts[1]);
          const speed = parseFloat(parts[3]);
          if (!isNaN(direction) && !isNaN(speed)) {
            parsedData.windDirection.push(direction);
            parsedData.windSpeed.push(speed);
          }
        } else if (parts[0] === "$WIMDA") {
          const pressure = parseFloat(parts[3]);
          const temp = parseFloat(parts[5]);
          const humidity = parseFloat(parts[9]);

          if (!isNaN(pressure)) parsedData.pressure.push(pressure);
          if (!isNaN(temp)) parsedData.temperature.push(temp);
          if (!isNaN(humidity)) parsedData.humidity.push(humidity);
        }
      });

      parsedData.timestamps.push(new Date().toLocaleTimeString());
    });

    console.log("Parsed Data: ", parsedData);
    return parsedData;
  };

  const parsedWeatherData = parseNMEAData(weatherStationRawData);

  useEffect(() => {
    const fetchData = async (project: string) => {
      try {
        const response = await axios.get(API_URL, {
          headers: { "X-API-KEY": API_KEY },
          params: { project },
        });

        if (!Array.isArray(response.data)) {
          console.error(`API response for ${project} is not an array:`, response.data);
          return;
        }

        const processedData = response.data
          .map((entry: any) => {
            try {
              if (!entry || !entry.timestamp || !entry.data) return null;

              let parsedData;
              if (typeof entry.data === "string") {
                try {
                  parsedData = JSON.parse(entry.data);
                } catch {
                  console.warn(`Non-JSON data detected, processing as raw string:`, entry.data);
                  parsedData = { raw: entry.data };
                }
              } else {
                parsedData = entry.data;
              }

              return { timestamp: entry.timestamp, data: parsedData };
            } catch (error) {
              console.error("Error processing entry:", entry, error);
              return null;
            }
          })
          .filter((entry): entry is { timestamp: string; data: any } => entry !== null)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(-10);

        if (project === "Load Cell") {
          const newSensorData: SensorData = {};
          processedData.forEach((entry) => {
            if (!entry || !entry.data) return;
            Object.entries(entry.data).forEach(([sensorKey, sensorData]: any) => {
              if (!newSensorData[sensorKey]) {
                newSensorData[sensorKey] = { timestamps: [], values: [] };
              }
              const timestamp = new Date(entry.timestamp).toLocaleTimeString();
              newSensorData[sensorKey].timestamps.push(timestamp);
              const sensorValue = sensorData?.value ? sensorData.value.replace(" N", "") : "0";
              newSensorData[sensorKey].values.push(parseFloat(sensorValue) || 0);
            });
          });
          setLoadCellData((prevData) => ({ ...prevData, ...newSensorData }));
        } else if (project === "Weather Station") {
          setWeatherStationRawData(processedData.map((entry) => entry.data.raw || "No Data"));
        }

        setLastUpdated(
          processedData.length > 0
            ? new Date(processedData[processedData.length - 1]?.timestamp).toLocaleString()
            : lastUpdated
        );
      } catch (error) {
        console.error(`Error fetching ${project} data:`, error);
      }
    };

    fetchData("Load Cell");
    fetchData("Weather Station");

    const interval = setInterval(() => {
      fetchData("Load Cell");
      fetchData("Weather Station");
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen bg-white text-gray-800 flex flex-col">
      <header className="w-full p-6 bg-gray-900 text-white text-2xl text-center font-bold shadow-md">
        LOURA
      </header>

      <div className="w-full h-full p-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-auto">
        <div className="col-span-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Load Cell Data</h1>
        </div>
        {Object.entries(loadCellData).map(([sensor, data], index) => (
          <div key={`loadcell-${index}`} className="p-6 bg-white rounded-lg shadow-md border border-gray-300 w-full h-[500px] flex flex-col">
            <h2 className="text-2xl font-semibold text-gray-800">{sensor}</h2>
            <p className="text-lg text-gray-600 mt-2">Latest Value: {data.values[data.values.length - 1]}</p>
            <div className="flex-grow w-full h-[350px]">
              <Line
                data={{
                  labels: data.timestamps,
                  datasets: [
                    {
                      label: "Sensor Readings",
                      data: data.values,
                      borderColor: "#007bff",
                      backgroundColor: "#007bff33",
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        ))}

        <div className="col-span-full mt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Weather Station Data</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wind Speed & Direction */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-300 w-full h-[400px]">
              <h2 className="text-2xl font-semibold text-gray-800">Wind Speed & Direction</h2>
              <Line
                data={{
                  labels: parsedWeatherData.timestamps,
                  datasets: [
                    {
                      label: "Wind Speed (m/s)",
                      data: parsedWeatherData.windSpeed,
                      borderColor: "#ff5733",
                      backgroundColor: "#ff573333",
                      borderWidth: 2,
                      yAxisID: 'y1',
                    },
                    {
                      label: "Wind Direction (°)",
                      data: parsedWeatherData.windDirection,
                      borderColor: "#33ff57",
                      backgroundColor: "#33ff5733",
                      borderWidth: 2,
                      yAxisID: 'y2',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y1: {
                      position: 'left',
                    },
                    y2: {
                      position: 'right',
                      grid: {
                        drawOnChartArea: false,
                      },
                    },
                  },
                }}
              />
            </div>

            {/* Temperature, Humidity & Pressure */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-300 w-full h-[400px]">
              <h2 className="text-2xl font-semibold text-gray-800">Temperature, Humidity & Pressure</h2>
              <Bar
                data={{
                  labels: parsedWeatherData.timestamps,
                  datasets: [
                    {
                      label: "Temperature (°C)",
                      data: parsedWeatherData.temperature,
                      backgroundColor: "#ffcc00",
                    },
                    {
                      label: "Humidity (%)",
                      data: parsedWeatherData.humidity,
                      backgroundColor: "#3399ff",
                    },
                    {
                      label: "Pressure (hPa)",
                      data: parsedWeatherData.pressure,
                      backgroundColor: "#9900cc",
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadCell;
