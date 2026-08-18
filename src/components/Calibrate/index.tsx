import React, { FC, useEffect, useMemo, useState } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectPalette } from '../../redux/slice';
import { saveCalibratedColor, sendCalibrationPixels } from '../../redux/thunk';
import {
	BASE_INDEX,
	CANDIDATES,
	Channel,
	NUDGE_STEPS,
	PANEL_STEP,
	SPREADS,
	candidatesToPixels,
	hexToRgb,
	isLight,
	makeCandidates,
	nudgeHex,
	snapHex,
} from '../../utils/calibrate';
import {
	CalibrateGlobalStyle,
	StyledButton,
	StyledCell,
	StyledCellHex,
	StyledCellNumber,
	StyledColumn,
	StyledLabel,
	StyledMap,
	StyledNote,
	StyledNumberInput,
	StyledPage,
	StyledRow,
	StyledSavedList,
	StyledSavedRow,
	StyledSavedSwatch,
	StyledSwatch,
	StyledSwatchGrid,
	StyledTargetSwatch,
	StyledTitle,
} from './Calibrate.styled';

const START_COLOR = '#7CFC00';
const CHANNELS: Channel[] = ['r', 'g', 'b'];

// 40 ходовых цветов, чтобы не крутить пикер ради очевидного «просто красный».
// Клик = выбрать эталоном, дальше он крутится кнопками каналов, как любой другой.
const POPULAR_COLORS: [string, string][] = [
	['#FFFFFF', 'белый'],
	['#C0C0C0', 'светло-серый'],
	['#808080', 'серый'],
	['#404040', 'тёмно-серый'],
	['#000000', 'чёрный'],
	['#FF0000', 'красный'],
	['#B22222', 'кирпичный'],
	['#8B0000', 'тёмно-красный'],
	['#DC143C', 'малиновый'],
	['#FF6347', 'томатный'],
	['#FF7F50', 'коралловый'],
	['#FF4500', 'оранжево-красный'],
	['#FFA500', 'оранжевый'],
	['#FFD700', 'золотой'],
	['#FFFF00', 'жёлтый'],
	['#F0E68C', 'хаки'],
	['#F5DEB3', 'пшеничный'],
	['#A0522D', 'сиена'],
	['#8B4513', 'коричневый'],
	['#808000', 'оливковый'],
	['#ADFF2F', 'жёлто-зелёный'],
	['#7CFC00', 'салатовый'],
	['#00FF00', 'зелёный'],
	['#228B22', 'лесной зелёный'],
	['#006400', 'тёмно-зелёный'],
	['#00FA9A', 'весенний зелёный'],
	['#40E0D0', 'бирюзовый'],
	['#00FFFF', 'циан'],
	['#008080', 'тил'],
	['#87CEEB', 'небесно-голубой'],
	['#1E90FF', 'голубой'],
	['#0000FF', 'синий'],
	['#00008B', 'тёмно-синий'],
	['#4B0082', 'индиго'],
	['#7B68EE', 'сине-фиолетовый'],
	['#8A2BE2', 'фиолетовый'],
	['#800080', 'пурпурный'],
	['#FF00FF', 'маджента'],
	['#FF69B4', 'розовый'],
	['#FFC0CB', 'светло-розовый'],
];

export const Calibrate: FC = () => {
	const dispatch = useAppDispatch();
	const palette = useAppSelector(selectPalette);

	// target — цвет, который я хочу видеть (эталон на экране, в диоды не уходит).
	// base — панельный цвет, вокруг которого строится окрестность кандидатов.
	const [target, setTarget] = useState(START_COLOR);
	const [base, setBase] = useState(() => snapHex(START_COLOR));
	const [spread, setSpread] = useState(SPREADS[0]);
	const [step, setStep] = useState(NUDGE_STEPS[1]);
	const [pick, setPick] = useState('');
	const [saved, setSaved] = useState('');

	const candidates = useMemo(() => makeCandidates(base, spread), [base, spread]);
	const pickedIndex = /^\d+$/.test(pick) && Number(pick) < CANDIDATES ? Number(pick) : null;

	// Любое изменение набора — сразу на панель. Пикер сыпет событиями во время
	// перетаскивания, поэтому небольшая задержка, чтобы не топить сокет.
	useEffect(() => {
		const timer = setTimeout(() => {
			dispatch(sendCalibrationPixels(candidatesToPixels(candidates)));
		}, 150);

		return () => clearTimeout(timer);
	}, [candidates, dispatch]);

	// Новая цель — начинаем поиск от неё же: это лучшая первая догадка.
	const handleTarget = (color: string) => {
		setTarget(color.toUpperCase());
		setBase(snapHex(color));
		setPick('');
	};

	const handleNudge = (channel: Channel, delta: number) => {
		setBase((prev) => nudgeHex(prev, channel, delta));
	};

	const handleSave = () => {
		if (pickedIndex === null) {
			return;
		}

		dispatch(saveCalibratedColor({ panel: candidates[pickedIndex], screen: target }));
		setSaved(`${candidates[pickedIndex]} -> ${target}`);
	};

	// Уточнение: выбранный кандидат становится базой, вокруг него новые 16.
	const handleTakeAsBase = () => {
		if (pickedIndex === null) {
			return;
		}

		setBase(candidates[pickedIndex]);
		setPick('');
	};

	const handleCopy = () => {
		const code = Object.entries(palette)
			.map(([panelColor, screenColor]) => `\t'${panelColor}': '${screenColor}',`)
			.join('\n');

		navigator.clipboard.writeText(code);
	};

	const baseRgb = hexToRgb(base);
	const savedPairs = Object.entries(palette);

	return (
		<>
			<CalibrateGlobalStyle />
			<StyledPage>
				<StyledColumn>
					<StyledTitle>1. Цвет, который я хочу видеть</StyledTitle>
					<HexColorPicker color={target} onChange={handleTarget} />
					<StyledRow>
						<StyledLabel>цель</StyledLabel>
						<HexColorInput
							color={target}
							onChange={handleTarget}
							prefixed
							style={{
								width: 84,
								padding: '6px 8px',
								backgroundColor: '#34373c',
								color: '#e6e6e6',
								border: '1px solid #4a4d52',
								borderRadius: 3,
								font: 'inherit',
							}}
						/>
					</StyledRow>
					<StyledSwatchGrid>
						{POPULAR_COLORS.map(([color, name]) => (
							<StyledSwatch
								key={color}
								color={color}
								isActive={color === target}
								title={`${name} ${color}`}
								onClick={() => handleTarget(color)}
							/>
						))}
					</StyledSwatchGrid>
					<StyledTargetSwatch color={target} />
					<StyledNote>
						Это эталон: смотри на него и ищи среди плашек на панели ту, что выглядит
						так же.
					</StyledNote>
				</StyledColumn>

				<StyledColumn>
					<StyledTitle>2. Крутим каналы</StyledTitle>
					<StyledRow>
						<StyledLabel>база</StyledLabel>
						<span>{base}</span>
						<span style={{ color: '#9aa0a6' }}>
							диоды {Math.floor(baseRgb.r / PANEL_STEP)}/
							{Math.floor(baseRgb.g / PANEL_STEP)}/
							{Math.floor(baseRgb.b / PANEL_STEP)} из 63
						</span>
					</StyledRow>

					{CHANNELS.map((channel) => (
						<StyledRow key={channel}>
							<StyledLabel>{channel.toUpperCase()}</StyledLabel>
							<StyledButton onClick={() => handleNudge(channel, -step)}>
								−
							</StyledButton>
							<StyledButton onClick={() => handleNudge(channel, step)}>+</StyledButton>
							<span style={{ color: '#9aa0a6' }}>{baseRgb[channel]}</span>
						</StyledRow>
					))}

					<StyledRow>
						<StyledLabel>шаг</StyledLabel>
						{NUDGE_STEPS.map((value) => (
							<StyledButton
								key={value}
								isActive={value === step}
								onClick={() => setStep(value)}
							>
								{value}
							</StyledButton>
						))}
					</StyledRow>

					<StyledRow>
						<StyledLabel>разброс</StyledLabel>
						{SPREADS.map((value) => (
							<StyledButton
								key={value}
								isActive={value === spread}
								onClick={() => setSpread(value)}
							>
								{value}
							</StyledButton>
						))}
					</StyledRow>

					<StyledNote>
						Кнопки сдвигают всю окрестность по каналу, шаг кратен {PANEL_STEP}: панель
						различает 64 уровня на канал, меньший шаг диоды не заметят. Столбцы —
						оттенок, строки — светлота, разброс задаёт их шаг. Плашка №{BASE_INDEX} —
						это сама база.
					</StyledNote>
				</StyledColumn>

				<StyledColumn>
					<StyledTitle>3. Номер плашки, которая совпала</StyledTitle>
					<StyledMap>
						{candidates.map((color, index) => (
							<StyledCell
								key={index}
								color={color}
								isLight={isLight(color)}
								isPicked={index === pickedIndex}
								onClick={() => setPick(String(index))}
							>
								<StyledCellNumber>{index}</StyledCellNumber>
								<StyledCellHex>{color}</StyledCellHex>
							</StyledCell>
						))}
					</StyledMap>

					<StyledRow>
						<StyledNumberInput
							value={pick}
							placeholder="0-15"
							onChange={(e) => setPick(e.target.value.replace(/\D/g, '').slice(0, 2))}
							onKeyDown={(e) => e.key === 'Enter' && handleSave()}
						/>
						<StyledButton onClick={handleSave}>Сохранить</StyledButton>
						<StyledButton onClick={handleTakeAsBase}>Взять за базу</StyledButton>
					</StyledRow>

					<StyledNote>
						Enter — сохранить пару на сервер. «Взять за базу» — построить 16 новых
						вокруг выбранной плашки (уточнить). Панель во время подбора затирается
						целиком, это нормально.
					</StyledNote>
					{saved && <div>сохранено: {saved}</div>}
				</StyledColumn>

				<StyledColumn>
					<StyledTitle>Палитра на сервере ({savedPairs.length})</StyledTitle>
					<StyledSavedList>
						{savedPairs.map(([panelColor, screenColor]) => (
							<StyledSavedRow key={panelColor}>
								<StyledSavedSwatch color={screenColor} />
								<span>
									{panelColor} -&gt; {screenColor}
								</span>
							</StyledSavedRow>
						))}
					</StyledSavedList>
					{!!savedPairs.length && (
						<StyledButton onClick={handleCopy}>
							Скопировать как PALETTE_DICTIONARY
						</StyledButton>
					)}
				</StyledColumn>
			</StyledPage>
		</>
	);
};
