import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Navbar.tsx";
import DataGraph from "./components/DataGraph.tsx";
import LoadCell from "./components/LoadCell.tsx";

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex min-h-screen bg-white">
        {/* Sidebar (Fixed Width) */}
        <Sidebar />

        {/* Main Content Area (Takes Remaining Space) */}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/loadcell" element={<DataGraph />} />
            <Route path="/" element={<LoadCell />} />
            {/* Add more routes as needed */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
