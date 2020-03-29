import React, {useState} from 'react';
import {Container, LineChart} from "davi-js";
import './App.css';

function App() {
    const defaultQuery = (document.location.hash && document.location.hash.length > 2) ? decodeURIComponent(document.location.hash.replace('#', '')) : '';
    const [isLoading, setIsLoading] = useState(false);
    const [promql, setPromql] = useState(defaultQuery);
    const [data, setData] = useState([]);
    const [duration, setDuration] = useState('PT30M');
    const [step, setStep] = useState(5);
    const [sourceIds, setSourceIds] = useState([]);

    const onKeyDown = event => {
        if (event.key === 'Enter' && promql.length > 0) {
            document.location.hash = '#' + encodeURIComponent(promql);
            query(promql, duration, step, setIsLoading, setData);
        }
    };
    return (
        <div className="App">
            <h1>Log Cache UI</h1>
            <label>PromQL: <input value={promql}
                                  size={150}
                                  placeholder={'PromQL'}
                                  onChange={event => setPromql(event.target.value)}
                                  onKeyDown={onKeyDown}
            /></label>

            &nbsp;<label>Duration: <input value={duration}
                                          size={10}
                                          onChange={event => setDuration(event.target.value)}
                                          onKeyDown={onKeyDown}/></label>
            &nbsp;<label>Step: <input type={'number'}
                                      size={5}
                                      min={1}
                                      value={step}
                                      onChange={event => setStep(event.target.value)}
                                      onKeyDown={onKeyDown}/></label>
            <br/>
            <br/>
            <Container title={{text: `${promql}`}} loading={isLoading}>
                <LineChart
                    isPromQL={true}
                    zoomEnabled={true}
                    data={data}
                    promQLSeriesKey={d => {
                        const metrics = d.metric;
                        if (metrics.application) {
                            return `${metrics.organization}/${metrics.space}/${metrics.application}/${metrics.applicationInstance}`;
                        }
                        return `${metrics.ip}/${metrics.deployment}/${metrics.job}`;
                    }}
                    xAxisTooltipFormat={x => `${new Date(x).toLocaleString()}`}
                    yAxisTooltipFormat={y => `${y}`}
                    height={500}/>
            </Container>
            <h3>Available Source IDs</h3>
            <button onClick={() => loadSourceIds(setSourceIds)}>Load</button>
            <ul>{sourceIds.map(m => <li key={m}><code>{m}</code>&nbsp;
                <a onClick={() => appendSourceId(m, setPromql)} href={'#'}>Append</a>&nbsp;/&nbsp;
                <a href={`/read/${m}`} target={'_blank'}>Retrieve Data</a>
            </li>)}</ul>
        </div>
    );
}

function loadSourceIds(setSourceIds) {
    fetch('/meta')
        .then(res => {
            return res.json();
        })
        .catch(e => console.error(e))
        .then(json => {
            if (json.meta) {
                setSourceIds(prevState => {
                    return Object.keys(json.meta);
                });
            } else {
                alert(JSON.stringify(json, null, '  '));
            }
        });
}

function appendSourceId(sourceId, setPromql) {
    setPromql(promql => promql.indexOf('{') > 0 ? promql.replace('{', `{source_id="${sourceId}", `) : `${promql}{source_id="${sourceId}"}`);
}

function query(promql, duration, step, setIsLoading, setData) {
    const params = new URLSearchParams();
    params.set('promql', promql);
    params.set('duration', duration);
    params.set('step', step);
    setIsLoading(prevState => true);
    fetch(`/query_range?${params}`)
        .then(res => {
            setIsLoading(prevState => false);
            return res.json();
        })
        .catch(e => console.error(e))
        .then(json => {
            if (json && json.data && json.data.result) {
                setData(prevState => {
                    return json.data.result;
                });
            } else {
                alert(JSON.stringify(json, null, '  '));
            }
        });
}

export default App;
