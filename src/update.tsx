import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Update } from './components/Update';

const container = document.getElementById('root')!;

const root = ReactDOM.createRoot(container);

root.render(<Update />);
