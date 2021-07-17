import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {

  const [data, setData] = useState(Array(32).fill("UNKNOWN"));
  const [keyword, setKeyword] = useState("");
  const [batches, setBatches] = useState([]);

  const submitBatch = async (keyword) => {
    setData(Array(30).fill("UNKNOWN"));
    await axios.post("http://localhost:5000/submitBatch", { keyword: keyword} );
    getBatches();
    checkClassification(keyword);
  }

  const getBatches = async () => {
    axios.get("http://localhost:5000/batches").then(res => {
      if (res.data?.length > 0) setBatches(res.data);
    });
  }

  const checkClassification = async (key) => {
    let bytesLoaded = 0;
    axios({
      url: `http://localhost:5000/getClassifications/${key}/0/`, //${data.filter(d => d !== "UNKNOWN").length}/`,
      method: "GET", 
      onDownloadProgress: progressEvent => {
        console.log("dataChunk", progressEvent.currentTarget.response.substr(bytesLoaded));
        const dataChunk = JSON.parse(progressEvent.currentTarget.response.substr(bytesLoaded));
        bytesLoaded = progressEvent.loaded;
        console.log("dataChunkJSON", dataChunk);
        if (Array.isArray(dataChunk)) setData(dataChunk);
        else if (dataChunk.label) {
          setTimeout(() => {
            setData(prev => {
              console.log("Old array", prev);
              var arr = [...prev];
              arr.splice(dataChunk.index,1,dataChunk);
              console.log("New array", arr);
              return arr;
            });
          }, 0);
        }
      }
    });
  }

  useEffect(() => {
    getBatches();
  }, []);

  return (
    <div className="App">      
      <div className="App-header">
        <select onChange={(e) => checkClassification(e.target.value)}>
          {batches.map((b, i) => <option value={b.keyword} key={i}>{b.keyword}</option>)}
        </select>
        <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} />
        <button onClick={() => submitBatch(keyword)}>Submit</button>
      </div>
      <div className="container">
        {data.map((d, i) => 
          <div className={`gridItem ${d.label || "UNKNOWN"}`} key={i}>{d.index} {d.label}</div>
          )}
        
      </div>
    </div>
  );
}

export default App;
