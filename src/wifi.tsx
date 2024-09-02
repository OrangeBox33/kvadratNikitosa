import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Wifi } from './components/Wifi';

const container = document.getElementById('root')!;

const root = ReactDOM.createRoot(container);

root.render(<Wifi />);
