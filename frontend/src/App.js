import { BrowserRouter, Routes, Route } from "react-router-dom";
import ResourceHub from "./components/ResourceHub";
import "./App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ResourceHub />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;