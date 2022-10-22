import { useState, useEffect } from 'react'
import { Grid } from './components/grid/Grid'
import { Keyboard } from './components/keyboard/Keyboard'
import { InfoModal } from './components/modals/InfoModal'
import { StatsModal } from './components/modals/StatsModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { LeaderBoardModal } from './components/modals/LeaderBoardModal'
import { MonthlyLeaderBoardModal } from './components/modals/MonthlyLeaderBoardModal'
import {
	WIN_MESSAGES,
	GAME_COPIED_MESSAGE,
	NOT_ENOUGH_LETTERS_MESSAGE,
	WORD_NOT_FOUND_MESSAGE,
	CORRECT_WORD_MESSAGE,
	HARD_MODE_ALERT_MESSAGE,
	DISCOURAGE_INAPP_BROWSER_TEXT,
	ERROR_SENDING_SCORE_TEXT
} from './constants/strings'
import {
	MAX_CHALLENGES,
	REVEAL_TIME_MS,
	WELCOME_INFO_MODAL_MS,
	DISCOURAGE_INAPP_BROWSERS,
	BONUS_POINTS_ARRAY
} from './constants/settings'
import {
	isWordInWordList,
	isWinningWord,
	solution,
	solutionIndex,
	findFirstUnusedReveal,
	unicodeLength,
} from './lib/words'
import { addStatsForCompletedGame, loadStats } from './lib/stats'
import {
	loadGameStateFromLocalStorage,
	saveGameStateToLocalStorage,
	setStoredIsHighContrastMode,
	getStoredIsHighContrastMode,
	loadNameFromLocalStorage,
	saveNameToLocalStorage
} from './lib/localStorage'
import { default as GraphemeSplitter } from 'grapheme-splitter'

import './App.css'
import { AlertContainer } from './components/alerts/AlertContainer'
import { useAlert } from './context/AlertContext'
import { Navbar } from './components/navbar/Navbar'
import { isInAppBrowser } from './lib/browser'
import useHTTP from './hooks/use-http'



function App() {
	const prefersDarkMode = window.matchMedia(
		'(prefers-color-scheme: dark)'
	).matches

	const [name, setName] = useState(() => loadNameFromLocalStorage())

	const { showError: showErrorAlert, showSuccess: showSuccessAlert } =
		useAlert()
	const [currentGuess, setCurrentGuess] = useState('')
	const [isGameWon, setIsGameWon] = useState(false)
	const [pointsEarned, setPointsEarned] = useState(0)
	const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
	const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
	const [isLeaderBoardModalOpen, setIsLeaderBoardModalOpen] = useState(false)
	const [isMonthlyLeaderBoardModalOpen, setIsMonthlyLeaderBoardModalOpen] = useState(false)
	const [currentRowClass, setCurrentRowClass] = useState('')
	const [isGameLost, setIsGameLost] = useState(false)
	const [isDarkMode, setIsDarkMode] = useState(
		localStorage.getItem('theme')
			? localStorage.getItem('theme') === 'dark'
			: prefersDarkMode
				? true
				: false
	)
	const [isHighContrastMode, setIsHighContrastMode] = useState(
		getStoredIsHighContrastMode()
	)
	const [isRevealing, setIsRevealing] = useState(false)
	const [guesses, setGuesses] = useState<string[]>(() => {
		const loaded = loadGameStateFromLocalStorage()
		if (loaded?.solution !== solution) {
			return []
		}
		const gameWasWon = loaded.guesses.includes(solution)
		if (gameWasWon) {
			setIsGameWon(true)
		}
		if (loaded.guesses.length === MAX_CHALLENGES && !gameWasWon) {
			setIsGameLost(true)
			showErrorAlert(CORRECT_WORD_MESSAGE(solution, 0), {
				persist: true,
			})
		}
		return loaded.guesses
	})

	const [stats, setStats] = useState(() => loadStats())

	const [isHardMode, setIsHardMode] = useState(
		localStorage.getItem('gameMode')
			? localStorage.getItem('gameMode') === 'hard'
			: false
	)

	const {
		//isLoading: isSendScoreLoading,
		error: sendScoreError,
		sendRequest: sendScore
	} = useHTTP();

	const {
		//isLoading: isGetMonthlyScoreLoading,
		error: getMonthlyScoreError,
		sendRequest: getMonthlyScore
	} = useHTTP();

	const sendScoreToServer = (wordID: number, attempts: number, name: string, lost = false) => {
		const today = new Date()
		const time = today.getHours() + ":" + (today.getMinutes() < 10 ? '0' : '') + today.getMinutes()
		const monthID = (today.getMonth() + 1) + '' + today.getFullYear()

		const bonusPoints = BONUS_POINTS_ARRAY[lost ? 7 : attempts];
		setPointsEarned(bonusPoints);

		const reqConfig = {
			url: 'https://palavra-da-hora-default-rtdb.europe-west1.firebasedatabase.app/scores/' + wordID + ".json",
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: {
				"attempts": attempts.toString(),
				"name": name,
				"timestamp": time
			}
		};

		sendScore(reqConfig, () => { });

		const reqGetLatestScoreConfig = {
			url: 'https://palavra-da-hora-default-rtdb.europe-west1.firebasedatabase.app/monthly-scores/' + monthID + '/' + name + ".json",
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		};

		getMonthlyScore(reqGetLatestScoreConfig, (data: any) => {
			let currentPoints = 0;
			if (data != null && typeof (data) === 'number') {
				currentPoints = data;
			}

			const newPoints = currentPoints + bonusPoints;

			const reqPatchNewPoints = {
				url: 'https://palavra-da-hora-default-rtdb.europe-west1.firebasedatabase.app/monthly-scores/' + monthID + ".json",
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: {
					[name]: newPoints
				}
			};

			sendScore(reqPatchNewPoints, () => { });
		});
	}

	useEffect(() => {
		if (sendScoreError) {
			showErrorAlert(ERROR_SENDING_SCORE_TEXT, {
				persist: true
			})
		}
	}, [sendScoreError, showErrorAlert]);

	useEffect(() => {
		// if no game state on load,
		// show the user the how-to info modal
		if (!loadGameStateFromLocalStorage()) {
			setTimeout(() => {
				setIsInfoModalOpen(true)
			}, WELCOME_INFO_MODAL_MS)
		}

		// if no name on load, ask for name
		if (!name || name.length < 3) {
			let enteredName = prompt('What\'s your name?')

			while (!enteredName || enteredName.length < 3) {
				enteredName = prompt('What\'s your name? More than 3 characters.')
			}

			saveNameToLocalStorage(enteredName)
			setName(enteredName)
		}
	}, [name])

	useEffect(() => {
		DISCOURAGE_INAPP_BROWSERS &&
			isInAppBrowser() &&
			showErrorAlert(DISCOURAGE_INAPP_BROWSER_TEXT, {
				persist: false,
				durationMs: 7000,
			})
	}, [showErrorAlert])

	useEffect(() => {
		if (isDarkMode) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}

		if (isHighContrastMode) {
			document.documentElement.classList.add('high-contrast')
		} else {
			document.documentElement.classList.remove('high-contrast')
		}
	}, [isDarkMode, isHighContrastMode])

	const handleDarkMode = (isDark: boolean) => {
		setIsDarkMode(isDark)
		localStorage.setItem('theme', isDark ? 'dark' : 'light')
	}

	const handleHardMode = (isHard: boolean) => {
		if (guesses.length === 0 || localStorage.getItem('gameMode') === 'hard') {
			setIsHardMode(isHard)
			localStorage.setItem('gameMode', isHard ? 'hard' : 'normal')
		} else {
			showErrorAlert(HARD_MODE_ALERT_MESSAGE)
		}
	}

	const handleHighContrastMode = (isHighContrast: boolean) => {
		setIsHighContrastMode(isHighContrast)
		setStoredIsHighContrastMode(isHighContrast)
	}

	const clearCurrentRowClass = () => {
		setCurrentRowClass('')
	}

	useEffect(() => {
		saveGameStateToLocalStorage({ guesses, solution })
	}, [guesses])

	useEffect(() => {
		if (isGameWon) {
			const winMessage =
				WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)] + ", +" + pointsEarned + " pts!"
			const delayMs = REVEAL_TIME_MS * solution.length

			showSuccessAlert(winMessage, {
				delayMs,
				onClose: () => setIsStatsModalOpen(true),
			})
		}

		if (isGameLost) {
			setTimeout(() => {
				setIsStatsModalOpen(true)
			}, (solution.length + 1) * REVEAL_TIME_MS)
		}
	}, [isGameWon, isGameLost, showSuccessAlert, pointsEarned])

	const onChar = (value: string) => {
		if (
			unicodeLength(`${currentGuess}${value}`) <= solution.length &&
			guesses.length < MAX_CHALLENGES &&
			!isGameWon
		) {
			setCurrentGuess(`${currentGuess}${value}`)
		}
	}

	const onDelete = () => {
		setCurrentGuess(
			new GraphemeSplitter().splitGraphemes(currentGuess).slice(0, -1).join('')
		)
	}

	const onEnter = () => {
		if (isGameWon || isGameLost) {
			return
		}

		if (!(unicodeLength(currentGuess) === solution.length)) {
			setCurrentRowClass('jiggle')
			return showErrorAlert(NOT_ENOUGH_LETTERS_MESSAGE, {
				onClose: clearCurrentRowClass,
			})
		}

		if (!isWordInWordList(currentGuess)) {
			setCurrentRowClass('jiggle')
			return showErrorAlert(WORD_NOT_FOUND_MESSAGE, {
				onClose: clearCurrentRowClass,
			})
		}

		// enforce hard mode - all guesses must contain all previously revealed letters
		if (isHardMode) {
			const firstMissingReveal = findFirstUnusedReveal(currentGuess, guesses)
			if (firstMissingReveal) {
				setCurrentRowClass('jiggle')
				return showErrorAlert(firstMissingReveal, {
					onClose: clearCurrentRowClass,
				})
			}
		}

		setIsRevealing(true)
		// turn this back off after all
		// chars have been revealed
		setTimeout(() => {
			setIsRevealing(false)
		}, REVEAL_TIME_MS * solution.length)

		const winningWord = isWinningWord(currentGuess)

		if (
			unicodeLength(currentGuess) === solution.length &&
			guesses.length < MAX_CHALLENGES &&
			!isGameWon
		) {
			setGuesses([...guesses, currentGuess])
			setCurrentGuess('')

			if (winningWord) {
				sendScoreToServer(solutionIndex, guesses.length + 1, name);
				setStats(addStatsForCompletedGame(stats, guesses.length))
				return setIsGameWon(true)
			}

			if (guesses.length === MAX_CHALLENGES - 1) {
				sendScoreToServer(solutionIndex, guesses.length + 1, name, true);
				setStats(addStatsForCompletedGame(stats, guesses.length + 1))
				setIsGameLost(true)
				showErrorAlert(CORRECT_WORD_MESSAGE(solution, BONUS_POINTS_ARRAY[7]), {
					persist: true,
					delayMs: REVEAL_TIME_MS * solution.length + 1,
				})
			}
		}
	}

	return (
		<div className="h-screen flex flex-col">
			<Navbar
				setIsInfoModalOpen={setIsInfoModalOpen}
				setIsStatsModalOpen={setIsStatsModalOpen}
				setIsSettingsModalOpen={setIsSettingsModalOpen}
				setIsLeaderBoardModalOpen={setIsLeaderBoardModalOpen}
				setIsMonthlyLeaderBoardModalOpen={setIsMonthlyLeaderBoardModalOpen}
			/>
			<div className="pt-2 px-1 pb-8 md:max-w-7xl w-full mx-auto sm:px-6 lg:px-8 flex flex-col grow">
				<div className="pb-6 grow">
					<Grid
						solution={solution}
						guesses={guesses}
						currentGuess={currentGuess}
						isRevealing={isRevealing}
						currentRowClassName={currentRowClass}
					/>
				</div>
				<Keyboard
					onChar={onChar}
					onDelete={onDelete}
					onEnter={onEnter}
					solution={solution}
					guesses={guesses}
					isRevealing={isRevealing}
				/>
				<InfoModal
					isOpen={isInfoModalOpen}
					handleClose={() => setIsInfoModalOpen(false)}
				/>

				<LeaderBoardModal
					isOpen={isLeaderBoardModalOpen}
					handleClose={() => setIsLeaderBoardModalOpen(false)}
					wordID={solutionIndex}
				/>

				<MonthlyLeaderBoardModal
					isOpen={isMonthlyLeaderBoardModalOpen}
					handleClose={() => setIsMonthlyLeaderBoardModalOpen(false)}
					name={name}
				/>

				<StatsModal
					isOpen={isStatsModalOpen}
					handleClose={() => setIsStatsModalOpen(false)}
					solution={solution}
					guesses={guesses}
					gameStats={stats}
					isGameLost={isGameLost}
					isGameWon={isGameWon}
					handleShareToClipboard={() => showSuccessAlert(GAME_COPIED_MESSAGE)}
					isHardMode={isHardMode}
					isDarkMode={isDarkMode}
					isHighContrastMode={isHighContrastMode}
					numberOfGuessesMade={guesses.length}
				/>
				<SettingsModal
					isOpen={isSettingsModalOpen}
					handleClose={() => setIsSettingsModalOpen(false)}
					isHardMode={isHardMode}
					handleHardMode={handleHardMode}
					isDarkMode={isDarkMode}
					handleDarkMode={handleDarkMode}
					isHighContrastMode={isHighContrastMode}
					handleHighContrastMode={handleHighContrastMode}
				/>
				<AlertContainer />
			</div >
		</div >
	)
}

export default App
