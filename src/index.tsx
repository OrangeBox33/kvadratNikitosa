import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import './index.css';

const container = document.getElementById('root')!;

const root = ReactDOM.createRoot(container);

root.render(
	<Provider store={store}>
		<App />
	</Provider>
);
