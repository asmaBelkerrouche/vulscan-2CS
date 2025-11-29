import React from "react"; // Import React library
import ReactDOM from "react-dom/client"; // Import ReactDOM for rendering the app to the DOM
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter for client-side routing
import App from "./App"; // Import the main App component
import "./index.css"; // Import global CSS styles

// Create the root DOM node where React will render the app
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the app inside the root element
root.render(
  <React.StrictMode>
    {/* React.StrictMode helps highlight potential problems in the app during development */}
    
    <BrowserRouter>
      {/* BrowserRouter enables routing in the app using the HTML5 history API */}
      
      <App />
      {/* The main App component is rendered here */}
    </BrowserRouter>
  </React.StrictMode>
);
