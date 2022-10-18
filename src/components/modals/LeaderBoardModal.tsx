import { BaseModal } from './BaseModal'
import useHTTP from '../../hooks/use-http'
import { useCallback, useEffect, useState } from 'react'

type Props = {
    isOpen: boolean
    handleClose: () => void
}

const DUMMY_SCORES = [
    { id: 's1', name: 'Guga', attempts: '4', timestamp: '23:09' },
    { id: 's2', name: 'Miguel', attempts: '2', timestamp: '23:17' },
    { id: 's3', name: 'Tatiana', attempts: '6', timestamp: '23:29' },
    { id: 's4', name: 'Verónica', attempts: '7', timestamp: '23:54' },
    { id: 's5', name: 'Catré', attempts: '1', timestamp: '23:20' }
];

export const LeaderBoardModal = ({
    isOpen,
    handleClose
}: Props) => {

    // states
    const [scores, setScores] = useState(DUMMY_SCORES);
    const {
        isLoading: isLeaderBoardLoading,
        error: requestLeaderBoardError,
        sendRequest: sendLeaderBoardRequest
    } = useHTTP();

    // updater function
    const updateLeaderBoard = useCallback(async () => {
        const reqConfig = {
            url: 'https://palavra-da-hora-default-rtdb.europe-west1.firebasedatabase.app/scores.json',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // data arrives here
        const receiveCallback = (data: { [x: string]: any }) => {
            console.log(data['150']);

            let scores_temp = data['150'];
            let keys = Object.keys(scores_temp);
            let unordered_scores = [];

            for (let k of keys) {
                unordered_scores.push({ id: k, ...scores_temp[k] });
            }

            //scores_temp.map((s: { "": any }) => {id: });

            let ordered_scores = unordered_scores?.sort((a, b) => (a.attempts > b.attempts ? 1 : -1));

            setScores(ordered_scores);
        }

        await sendLeaderBoardRequest(reqConfig, receiveCallback);
    }, [sendLeaderBoardRequest]);

    // componentDidMount
    useEffect(() => {
        updateLeaderBoard();
    }, [updateLeaderBoard]);

    let position = 1;

    return (
        <BaseModal title="Leaderboard" isOpen={isOpen} handleClose={handleClose}>
            <div className="flex flex-col mt-2 divide-y text-gray-500 dark:text-gray-300">

                <ol>
                    {scores.map((score) => <li key={score.id}>{position++}. {score.name} {score.attempts}/6 <span className="text-xs">{score.timestamp}</span></li>)}
                </ol>

            </div>
        </BaseModal>
    )
}
