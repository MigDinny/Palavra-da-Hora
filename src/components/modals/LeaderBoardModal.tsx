import { BaseModal } from './BaseModal'
import useHTTP from '../../hooks/use-http'
import { useCallback, useEffect, useState } from 'react'

type Props = {
    isOpen: boolean
    handleClose: () => void
    wordID: number
}

type Score = {
    id: string
    name: string
    attempts: number
    timestamp: string
}

export const LeaderBoardModal = ({
    isOpen,
    handleClose,
    wordID
}: Props) => {

    // states
    const [scores, setScores] = useState<Score[]>([]);
    const {
        //isLoading: isLeaderBoardLoading,
        //error: requestLeaderBoardError,
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
            console.log(data[wordID.toString()]);

            let scores_temp = data[wordID.toString()];
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
    }, [sendLeaderBoardRequest, wordID]);

    // componentDidMount
    useEffect(() => {
        updateLeaderBoard();
    }, [updateLeaderBoard]);

    // component was opened
    useEffect(() => {
        isOpen && updateLeaderBoard();
    }, [isOpen, updateLeaderBoard]);

    let position = 1;

    return (
        <BaseModal title="Leaderboard" isOpen={isOpen} handleClose={handleClose}>
            <div className="flex flex-col mt-2 divide-y text-gray-500 dark:text-gray-300">
                {scores.length > 0 &&
                    <ol>
                        {scores.map((score) => <li key={score.id}>{position++}. {score.name} {score.attempts}/6 <span className="text-xs">{score.timestamp}</span></li>)}
                    </ol>
                }

                {scores.length === 0 &&
                    <span>Nobody scored. Be the first!</span>
                }

            </div>
        </BaseModal>
    )
}
