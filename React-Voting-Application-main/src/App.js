import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./Components/Register";  

import Login from "./Components/Login";
import Connected from "./Components/Connected";
import Admin from "./Components/Admin";
console.log("Admin Component:", Admin);
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/connected" element={<Connected />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </Router>
    );
}

export default App;
