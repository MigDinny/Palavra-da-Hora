import { BaseModal } from './BaseModal'
import useHTTP from '../../hooks/use-http'
import { useCallback, useEffect, useState } from 'react'

type Props = {
    isOpen: boolean
    handleClose: () => void
}

type Score = {
    id: string
    name: string
    points: number
}

export const MonthlyLeaderBoardModal = ({
    isOpen,
    handleClose
}: Props) => {

    // states
    const [scores, setScores] = useState<Score[]>([]);
    const {
        //isLoading: isMonthlyLeaderBoardLoading,
        //error: requestMonthlyLeaderBoardError,
        sendRequest: sendMonthlyLeaderBoardRequest
    } = useHTTP();

    // updater function
    /*const updateMonthlyLeaderBoard = useCallback(async () => {
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
            let timely_ordered_scores = unordered_scores.reverse();
            let ordered_scores = timely_ordered_scores?.sort((a, b) => (a.attempts > b.attempts ? 1 : -1));

            setScores(ordered_scores);
        }

        await sendMonthlyLeaderBoardRequest(reqConfig, receiveCallback);
    }, [sendLeaderBoardRequest, wordID]);*/

    // componentDidMount
    /*useEffect(() => {
        updateMonthlyLeaderBoard();
    }, [updateMonthlyLeaderBoard]);

    // component was opened
    useEffect(() => {
        isOpen && updateMonthlyLeaderBoard();
    }, [isOpen, updateMonthlyLeaderBoard]);*/

    let position = 1;

    return (
        <BaseModal title="Monthly Leaderboard" isOpen={isOpen} handleClose={handleClose}>
            <div className="flex flex-col mt-2 divide-y text-gray-500 dark:text-gray-300">

            </div>
        </BaseModal>
    )
}
