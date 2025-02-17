import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface SensorData {
  [key: string]: { value: string };
}

const LoadCell: React.FC = () => {
  const [sensorData, setSensorData] = useState<{ [key: string]: { timestamps: string[]; values: number[] } }>({});
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const API_URL = 'http://37.60.247.110:2612/azp'; // Update with actual API URL
      const API_KEY = 'azp-261211102024-aquadrox'; // API Key
    
      try {
        const response = await axios.get(API_URL, {
          headers: { 'X-API-KEY': API_KEY },
        });
    
        // Ensure response.data is an array
        if (!Array.isArray(response.data)) {
          console.error("API response is not an array:", response.data);
          return;
        }
    
        const processedData = response.data.map((entry: any) => {
          try {
            const parsedData = typeof entry.data === "string" ? JSON.parse(entry.data) : entry.data;
            return { timestamp: entry.timestamp, data: parsedData };
          } catch (error) {
            console.error("Error parsing entry.data:", entry.data, error);
            return null; // Skip invalid entries
          }
        }).filter(Boolean); // Remove null values
    
        console.log("Parsed API Data:", processedData);
    
        if (processedData && processedData.length > 0) {
          const sortedData = processedData
            .filter((entry): entry is { timestamp: any; data: any } => entry !== null) // ✅ Ensure no nulls
            .sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
        
          const newSensorData: { [key: string]: { timestamps: string[]; values: number[] } } = {};
        
          sortedData.slice(-15).forEach((entry) => {
            try {
              if (!entry.data) return; // ✅ Avoid null reference error
        
              Object.entries(entry.data).forEach(([sensorKey, sensorData]: any) => {
                if (!newSensorData[sensorKey]) {
                  newSensorData[sensorKey] = { timestamps: [], values: [] };
                }
                const timestamp = new Date(entry.timestamp).toLocaleTimeString();
                newSensorData[sensorKey].timestamps.push(timestamp);
                newSensorData[sensorKey].values.push(parseFloat(sensorData.value.replace(" ppm", "")) || 0);
              });
            } catch (error) {
              console.error("Error processing sensor data:", entry, error);
            }
          });
        
          setSensorData(newSensorData);
          setLastUpdated(new Date(sortedData[sortedData.length - 1].timestamp).toLocaleString());
        }
        
        
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
    
  }, []);
  

  const colors = [
    "#007bff", "#28a745", "#dc3545", "#ffc107", "#17a2b8", "#6610f2",
    "#e83e8c", "#20c997", "#fd7e14", "#6c757d"
  ];

  return (
    <div className="w-full h-screen bg-white text-gray-800 flex flex-col">
      {/* Header */}
      <header className="w-full p-6 bg-gray-900 text-white text-2xl text-center font-bold shadow-md">
        LOURA 
      </header>

      {/* Grid Layout */}
      <div className="w-full h-full p-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-auto">
        {Object.entries(sensorData).map(([sensor, data], index) => (
          <div 
          key={index} 
          className="p-6 bg-white rounded-lg shadow-md border border-gray-300 w-full h-[500px] flex flex-col"
        >
          <h2 className="text-2xl font-semibold text-gray-800">{sensor}</h2>
          <p className="text-lg text-gray-600 mt-2">
            Latest Value: {data.values[data.values.length - 1]}
          </p>
        
          {/* Ensure Chart Fits Inside */}
          <div className="flex-grow w-full h-[350px]">
            <Line
              data={{
                labels: data.timestamps,
                datasets: [
                  {
                    label: "Sensor Readings",
                    data: data.values,
                    borderColor: colors[index % colors.length],
                    backgroundColor: colors[index % colors.length] + "33",
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false, // Allow chart to resize freely
              }}
            />
          </div>
        </div>
        
        ))}
      </div>

      {/* Footer */}
      <footer className="w-full p-6 text-center bg-gray-100 shadow-md">
        <p className="text-gray-600">Last Updated: {lastUpdated || "Fetching..."}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 py-3 px-8 bg-gray-900 text-white font-bold rounded-lg shadow-lg hover:bg-gray-800 transition duration-300"
        >
          Refresh Data
        </button>
      </footer>
    </div>
  );
};

export default LoadCell;
