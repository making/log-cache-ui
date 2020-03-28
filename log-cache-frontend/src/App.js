import React, {useEffect, useState} from 'react';
import {Container, LineChart} from "davi-js";
import './App.css';

function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [promql, setPromql] = useState('');
    const [data, setData] = useState([]);
    const [duration, setDuration] = useState('PT15M');
    const [step, setStep] = useState(10);
    const [meta, setMeta] = useState([]);

    useEffect(() => {
        fetch('/meta')
            .then(res => {
                return res.json();
            })
            .catch(e => console.error(e))
            .then(json => {
                if (json.meta) {
                    setMeta(prevState => {
                        return Object.keys(json.meta);
                    });
                } else {
                    alert(JSON.stringify(json, null, '  '));
                }
            });
    }, []);
    const onKeyDown = event => {
        if (event.key === 'Enter' && promql.length > 0) {
            query(promql, duration, step, setIsLoading, setData);
        }
    };
    return (
        <div className="App">
            <h1>Log Cache UI</h1>
            <label>PromQL: <input size={150} value={promql} placeholder={'PromQL'}
                                  onChange={event => setPromql(event.target.value)}
                                  onKeyDown={onKeyDown}
            /></label>

            &nbsp;<label>Duration: <input value={duration}
                                          onChange={event => setDuration(event.target.value)}
                                          onKeyDown={onKeyDown}/></label>
            &nbsp;<label>Step: <input value={step}
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
            <ul>{meta.map(m => <li key={m}><code>{m}</code>&nbsp;
                <a onClick={() => appendSourceId(m, setPromql)} href={'#'}>Append</a>&nbsp;
                <a href={`/read/${m}`} target={'_blank'}>Retrieve Data</a>
            </li>)}</ul>
        </div>
    );
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
