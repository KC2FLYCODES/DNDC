import { BrowserRouter, Routes, Route } from "react-router-dom";
import ResourceHub from "./components/ResourceHub";
import OrganizationSignup from "./components/OrganizationSignup";
import "./App.css";

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ResourceHub />} />
          <Route path="/signup" element={<OrganizationSignup api={API} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;