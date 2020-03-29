import React, {Fragment, useState} from 'react';
import {Container, LineChart} from "davi-js";
import {Dialog} from "@reach/dialog";
import "@reach/dialog/styles.css";
import './App.css';

function SupportedMetrics(props) {
    const [showDialog, setShowDialog] = useState(false);
    const [metrics, setMetrics] = useState([]);
    const sourceId = props.sourceId;
    const formatMetrics = (json) => {
        const supported = new Map();
        if (json.envelopes && json.envelopes.batch) {
            json.envelopes.batch
                .forEach(v => {
                    if (v.counter) {
                        supported.set(v.counter.name, {type: 'Counter', labels: Object.keys(v.tags)});
                    }
                    if (v.gauge) {
                        Object.keys(v.gauge.metrics)
                            .forEach(g => supported.set(g, {type: 'Gauge', labels: Object.keys(v.tags)}))
                    }
                });
            setMetrics([...supported]);
        }
    };
    const open = () => {
        fetch(`/read/${props.sourceId}?limit=100`)
            .then(res => res.json())
            .then(json => formatMetrics(json))
            .then(() => setShowDialog(true));
    };
    const close = () => setShowDialog(false);
    return (
        <Fragment>
            <a href={'#'} onClick={open}><code>{sourceId}</code></a>
            <Dialog isOpen={showDialog} onDismiss={close}>
                <button className="close-button" onClick={close}>
                    <span aria-hidden>×</span>
                </button>
                <h3>{sourceId}</h3>
                <a href={`/read/${sourceId}?limit=100`} target={'_blank'}>See Raw Data</a><br/>
                <dl>
                    {metrics.map(m => {
                        const [name, {type, labels}] = m;
                        const metricsName = name.replace(/\./g, '_').replace(/\//g, '_');
                        return <Fragment key={name}>
                            <dt><code>{name}</code> ({type})</dt>
                            <dd>
                                <button onClick={() => {
                                    props.setPromql(`${metricsName}{source_id="${sourceId}"}`);
                                    close();
                                }}>Set PromQL
                                </button>
                                &nbsp;
                                {type === 'Counter' && <button onClick={() => {
                                    props.setPromql(`rate(${metricsName}{source_id="${sourceId}"}[1m])`);
                                    close();
                                }}>Set PromQL (Rate)
                                </button>}
                                <br/>
                                Labels:
                                <code>{JSON.stringify(labels)}</code>
                            </dd>
                        </Fragment>;
                    })}
                </dl>
            </Dialog>
        </Fragment>
    );
}

function App() {
    const defaultQuery = (document.location.hash && document.location.hash.length > 2) ? decodeURIComponent(document.location.hash.replace('#', '')) : '';
    const [isLoading, setIsLoading] = useState(false);
    const [promql, setPromql] = useState(defaultQuery);
    const [data, setData] = useState([]);
    const [duration, setDuration] = useState('PT30M');
    const [step, setStep] = useState(10);
    const [autoReload, setAutoReload] = useState(null);
    const [showAllLabels, setShowAllLabels] = useState(false);
    const [sourceIds, setSourceIds] = useState({components: [], apps: []});

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
                                  size={100}
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
            <label>Auto Reload: <input type="checkbox" onChange={event => {
                const checked = event.target.checked;
                if (checked) {
                    setAutoReload(setInterval(() => onKeyDown({key: 'Enter'}), 30000));
                } else {
                    clearInterval(autoReload);
                    setAutoReload(null);
                }
            }}/></label>
            &nbsp;<label>Show All Labels: <input type="checkbox" onChange={event => {
            const checked = event.target.checked;
            setShowAllLabels(checked);
        }}/></label>
            <br/>
            <Container title={{text: `${promql}`}} loading={isLoading}>
                <LineChart
                    isPromQL={true}
                    zoomEnabled={true}
                    data={data}
                    promQLSeriesKey={d => {
                        const metrics = d.metric;
                        if (showAllLabels) {
                            return JSON.stringify(d.metric);
                        }
                        if (metrics.application) {
                            return [metrics.organization, metrics.space, metrics.application, metrics.applicationInstance]
                                .filter(x => x)
                                .join('/');
                        }
                        return [metrics.ip, metrics.deployment, metrics.job]
                            .filter(x => x)
                            .join('/');
                    }}
                    xAxisTooltipFormat={x => `${new Date(x).toLocaleString()}`}
                    yAxisTooltipFormat={y => `${y}`}
                    height={500}/>
            </Container>
            <h3>Available Source IDs</h3>
            <button onClick={() => loadSourceIds(setSourceIds)}>Load</button>
            <h4>Components</h4>
            <ul>{sourceIds.components.map(sourceId => <li key={sourceId}>
                <SupportedMetrics sourceId={sourceId}
                                  setPromql={setPromql}/>
            </li>)}</ul>
            <h4>Apps</h4>
            <ul>{sourceIds.apps.map(sourceId => <li key={sourceId}>
                <SupportedMetrics sourceId={sourceId}
                                  setPromql={setPromql}/>
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
                const ids = Object.keys(json.meta);
                setSourceIds({
                    components: ids.filter(x => x.length !== 36),
                    apps: ids.filter(x => x.length === 36)
                });
            } else {
                alert(JSON.stringify(json, null, '  '));
            }
        });
}

function query(promql, duration, step, setIsLoading, setData) {
    console.log('Querying...');
    const params = new URLSearchParams();
    params.set('promql', promql);
    params.set('duration', duration);
    params.set('step', step);
    setIsLoading(true);
    fetch(`/query_range?${params}`)
        .then(res => {
            setIsLoading(false);
            return res.json();
        })
        .catch(e => console.error(e))
        .then(json => {
            if (json && json.data && json.data.result) {
                setData(json.data.result);
            } else {
                alert(JSON.stringify(json, null, '  '));
            }
        });
}

export default App;
