import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { Calibrate } from './components/Calibrate';
// Импорт ради побочного эффекта: поднимает единственный сокет и подписывает
// стор на getGrid/getPalette. Без него палитра с сервера не приедет.
import './socket/socket';

const container = document.getElementById('root')!;

const root = ReactDOM.createRoot(container);

root.render(
	<Provider store={store}>
		<Calibrate />
	</Provider>
);
