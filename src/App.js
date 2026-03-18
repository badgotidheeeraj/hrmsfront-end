import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';
import Nav from './component/Nav';
import Home from './component/Home';

function App() {
  return (
    <div className="App">
      <Nav />
      <Home />
    </div>
  );
}

export default App;
