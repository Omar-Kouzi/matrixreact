import Routes from "./components/Navbar/Routes";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/footer/Footer";

function App() {
  return (
    <div className="App">
      <Navbar />
      <div className="Routes">
        <Routes />
      </div>
      <Footer />
    </div>
  );
}

export default App;
