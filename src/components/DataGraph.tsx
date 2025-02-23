import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import * as XLSX from 'xlsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define types for API response
interface SensorData {
  [key: string]: { value: string; timestamp?: string };
}

interface ApiResponse {
  timestamp?: string | null;
  created_at?: string | null;
  value: string;
  data: Record<string, { value: string; timestamp?: string }>;
}

const DataGraph: React.FC = () => {
  const [chartData, setChartData] = useState<{ [key: string]: number[] }>({});
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [originalData, setOriginalData] = useState<ApiResponse[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const API_URL = "http://100.78.31.68:2612/azp";
      const API_KEY = "azp-261211102024-aquadrox";
      const project = "Load Cell";
  
      try {
        const response = await axios.get(API_URL, {
          headers: { "X-API-KEY": API_KEY },
          params: { project }, 
        });
  
        if (!response.data || response.data.length === 0) {
          console.warn("⚠️ API returned empty data!");
          return;
        }
  
        // Parse and filter data
        const processedData = response.data
          .map((entry: any) => ({
            timestamp: entry.timestamp || entry.created_at || null,
            data: typeof entry.data === "string" ? JSON.parse(entry.data) : entry.data,
          }))
          .filter((entry) => entry.timestamp !== null) // Remove invalid timestamps
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Sort by time
          .slice(-50); // ✅ Keep only the last 50 records
  
        console.log("✅ Parsed API Data:", processedData);
  
        setOriginalData(processedData);
  
        const labels = processedData.map((entry) =>
          entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : "Unknown"
        );
  
        const sensorMap: { [key: string]: number[] } = {};
  
        processedData.forEach((entry) => {
          if (entry.data) {
            Object.keys(entry.data).forEach((sensor) => {
              if (!sensorMap[sensor]) sensorMap[sensor] = [];
              const value = parseFloat(entry.data[sensor]?.value || "0");
              if (!isNaN(value)) sensorMap[sensor].push(value);
            });
          }
        });
  
        setChartLabels(labels);
        setChartData(sensorMap);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      }
    };
  
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const exportToExcel = () => {
    if (!startDate || !endDate) {
      alert("Error, Please select a valid date range.");
      return;
    }

    console.log("📅 Exporting Data Between:", startDate, "and", endDate);
    console.log("Original Data:", originalData);

    const filteredData = originalData?.filter((entry) => entry?.timestamp) ?? [];

    if (filteredData.length === 0) {
      alert("No data available for the selected range.");
      return;
    }

    console.log("✅ Filtered Data:", filteredData);

    const excelData = filteredData.map((entry) => {
      let parsedData: SensorData = {};
      try {
        parsedData = typeof entry.data === "string" ? JSON.parse(entry.data) : entry.data ?? {};
      } catch (error) {
        console.warn("⚠️ Error parsing JSON data for entry:", entry, error);
        parsedData = {};
      }

      return {
        Timestamp: entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "Unknown",
        ...Object.entries(parsedData).reduce((acc, [sensor, sensorData]) => {
          acc[sensor] = sensorData?.value ?? "N/A";
          return acc;
        }, {} as Record<string, string>),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sensor Data");
    XLSX.writeFile(workbook, `LOURA_${startDate}_to_${endDate}.xlsx`);

    alert("✅ Excel file has been generated successfully!");
  };

  const datasets = Object.keys(chartData).map((sensor) => ({
    label: `${sensor}`,
    data: chartData[sensor],
    fill: false,
    backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`,
    borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`,
    tension: 0.4,
  }));

  const data = { labels: chartLabels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { maxRotation: 45, minRotation: 0 } },
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'LOAD CELL' },
    },
  };

  return (
    <div className="bg-white flex flex-col items-center min-h-screen ">
      <header className="w-full p-6 bg-gray-900 text-white text-2xl text-center mb-20 font-bold shadow-md">LOURA</header>
      <div className="w-full h-[70vh] p-4 mb-4">
        <Line data={data} options={options} />
      </div>
      <div className="flex gap-4 items-center">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded-lg shadow-md" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded-lg shadow-md" />
        <button onClick={exportToExcel} className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow-lg hover:bg-blue-600 transition">Export to Excel</button>
      </div>
    </div>
  );
};

export default DataGraph;
