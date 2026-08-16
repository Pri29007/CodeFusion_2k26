import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SchemeLanding from "./pages/SchemeLanding";
import SchemeApply from "./pages/SchemeApply";
import SchemeStatus from "./pages/SchemeStatus";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:schemeId" element={<SchemeLanding />} />
        <Route path="/:schemeId/apply" element={<SchemeApply />} />
        <Route path="/:schemeId/status" element={<SchemeStatus />} />
      </Routes>
    </BrowserRouter>
  );
}
