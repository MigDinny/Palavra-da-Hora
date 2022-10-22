import { BaseModal } from './BaseModal'
import useHTTP from '../../hooks/use-http'
import { useCallback, useEffect, useState } from 'react'

type Props = {
    isOpen: boolean
    handleClose: () => void
    name: string
}

type Score = {
    id: number
    name: string
    points: number
}

export const MonthlyLeaderBoardModal = ({
    isOpen,
    handleClose,
    name
}: Props) => {

    // states
    const [scores, setScores] = useState<Score[]>([]);

    const {
        //isLoading: isMonthlyLeaderBoardLoading,
        //error: requestMonthlyLeaderBoardError,
        sendRequest: sendMonthlyLeaderBoardRequest
    } = useHTTP();

    // updater function
    const updateMonthlyLeaderBoard = useCallback(async () => {
        const dateObj = new Date();
        const monthID = (dateObj.getMonth() + 1) + '' + dateObj.getFullYear();

        const reqConfig = {
            url: 'https://palavra-da-hora-default-rtdb.europe-west1.firebasedatabase.app/monthly-scores/' + monthID + '.json',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // data arrives here
        const receiveCallback = (data: { [x: string]: any }) => {

            // if (!data[name]) console.log("n ha mig");

            let unordered_scores = [];
            let i = 1;
            for (let k of Object.keys(data)) {
                unordered_scores.push({ id: i++, name: k, points: data[k] });
            }

            // sort by points
            let ordered_scores = unordered_scores?.sort();

            setScores(ordered_scores);
        }

        await sendMonthlyLeaderBoardRequest(reqConfig, receiveCallback);
    }, [sendMonthlyLeaderBoardRequest]);

    // componentDidMount
    useEffect(() => {
        updateMonthlyLeaderBoard();
    }, [updateMonthlyLeaderBoard]);

    // component was opened
    useEffect(() => {
        if (isOpen) updateMonthlyLeaderBoard();
    }, [isOpen, updateMonthlyLeaderBoard]);

    let position = 1;

    const currentMonth = new Date().toLocaleString('en-us', { month: 'long' });
    const currentYear = new Date().getFullYear();
    const ownScore = scores.find(s => s.name === name);

    const ownScoreContent = (!ownScore) ?
        (<div className="mt-2">
            <span className="font-medium">Your score: </span> <span>0 pts</span>
        </div>) :
        (<div className="mt-2">
            <span className="font-medium">Your score: </span> <span>{ownScore.points} pts</span>
        </div>);


    return (
        <BaseModal title="Monthly Leaderboard" isOpen={isOpen} handleClose={handleClose}>
            <div className="flex flex-col mt-2 divide-y text-gray-500 dark:text-gray-300">
                <div>
                    <p className="font-medium mt-2">{currentMonth} {currentYear}</p>


                    {scores.length > 0 &&
                        <ol className="mt-2">
                            {scores.map((s) => <li key={s.id}>{position++}. {s.name} <span className="text-xs">{s.points} pts</span></li>)}
                        </ol>
                    }

                    {scores.length === 0 &&
                        <span className="mt-2">Nobody scored this month. Be the first!</span>
                    }

                    {(scores.length > 0) &&
                        ownScoreContent
                    }
                </div>
            </div>
        </BaseModal>
    )
}
