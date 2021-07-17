import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';


let cancelToken;

function App() {

  const emptyData = Array(32).fill("UNKNOWN");

  const [data, setData] = useState(emptyData);
  const [keyword, setKeyword] = useState("");
  const [batches, setBatches] = useState([]);

  const submitBatch = async (keyword) => {
    if (cancelToken) {
      cancelToken.cancel();
      cancelToken = null;
    }
    setData(emptyData);
    await axios.post("http://localhost:5000/submitBatch", { keyword: keyword} );
    getBatches();
    checkClassification(keyword);
  }

  const getBatches = async () => {
    if (cancelToken) {
      cancelToken.cancel();
      cancelToken = null;
    }
    axios.get("http://localhost:5000/batches").then(res => {
      if (res.data?.length > 0) setBatches(res.data);
    });
  }

  const checkClassification = async (key) => {
    if (cancelToken) {
      console.log("CANCEL");
      cancelToken.cancel();
      cancelToken = null;
    }
    setData(emptyData);
    let bytesLoaded = 0;
    cancelToken = axios.CancelToken.source();
    axios({
      url: `http://localhost:5000/getClassifications/${key}/0/`,
      method: "GET", 
      cancelToken: cancelToken.token,
      onDownloadProgress: progressEvent => {
        const dataChunk = JSON.parse(progressEvent.currentTarget.response.substr(bytesLoaded));
        bytesLoaded = progressEvent.loaded;
        if (Array.isArray(dataChunk)) setData(prev => [...dataChunk, ...prev.slice(dataChunk.length)]);
        else if (dataChunk.keyword === key) {
          setData(prev => {
            var arr = [...prev];
            arr.splice(dataChunk.index,1,dataChunk);
            return arr;
          });
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
        <div className="form_box">
          <label htmlFor="batch_select">Select an existing batch:</label>
          <div>
            <select id="batch_select" onChange={(e) => checkClassification(e.target.value)}>
              {batches.map((b, i) => <option value={b.keyword} key={i}>{b.keyword}</option>)}
            </select>
          </div>
        </div>
        <div className="form_box">
          <label htmlFor="keyword">Type submission name</label>
          <div style={{ display: "flex"}}>
            <input id="keyword" type="text" value={keyword} onChange={e => setKeyword(e.target.value)} />
            <button onClick={() => submitBatch(keyword)}>Submit</button>
          </div>
        </div>
      </div>
      <div className="main">
        <div className="container">
          {data.map((d, i) => 
            <div className={`gridItem ${d.label || "UNKNOWN"}`} key={i} />
            )}
          
        </div>
        <div className="legend">
          <ul>
            <li><div className="legend-icon KWS_KERIDOS" />KWS_KERIDOS</li>
            <li><div className="legend-icon KWS_KERIDOS_YG" />KWS_KERIDOS_YG</li>
            <li><div className="legend-icon UNKNOWN" />UNKNOWN</li>
            <li><div className="legend-icon ERROR" />ERROR</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
