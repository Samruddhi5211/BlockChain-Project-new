import React, { useState, useEffect } from "react";
import { web3, votingContract } from "../Constant/constant";
import "../Components/Connected.css";

const Connected = () => {
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(null);
    const [account, setAccount] = useState("");
    const [isElectionActive, setIsElectionActive] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");

    useEffect(() => {
        loadCandidates();
        loadAccount();
        checkElectionStatus();
    }, []);

    const loadAccount = async () => {
        const accounts = await web3.eth.requestAccounts();
        setAccount(accounts[0]);
    };

    const loadCandidates = async () => {
        try {
            const result = await votingContract.methods.getAllCandidates().call();
            const names = Array.from(result[0]);
            const votes = Array.from(result[1]);
            const images = Array.from(result[2]);
            const parties = Array.from(result[3]);

            const formattedCandidates = names.map((name, index) => ({
                name,
                voteCount: Number(votes[index]),
                imageHash: images[index],
                partyName: parties[index],
            }));

            setCandidates(formattedCandidates);
        } catch (error) {
            console.error("Error loading candidates:", error);
        }
    };

    const checkElectionStatus = async () => {
        try {
            const status = await votingContract.methods.getVotingStatus().call();
            setIsElectionActive(status);
        } catch (error) {
            console.error("Error checking election status:", error);
        }
    };

    const castVote = async () => {
        if (!isElectionActive) return alert("Voting has not started yet.");
        if (selectedCandidateIndex === null) return alert("Please select a candidate to vote.");

        try {
            const previousVoteCount = candidates[selectedCandidateIndex].voteCount;

            await votingContract.methods.vote(selectedCandidateIndex).send({ from: account });

            const result = await votingContract.methods.getAllCandidates().call();
            const updatedVotes = Array.from(result[1]).map(v => Number(v));

            const newVoteCount = updatedVotes[selectedCandidateIndex];

            if (newVoteCount === previousVoteCount + 1) {
                const votedCandidate = candidates[selectedCandidateIndex];
                setConfirmationMessage(
                    `✅ Vote successfully cast for ${votedCandidate.name} (${votedCandidate.partyName})`
                );
            } else {
                setConfirmationMessage("❌ Vote failed or already cast. Please try again.");
            }

            loadCandidates(); // Refresh UI
        } catch (error) {
            console.error("Error voting:", error);
            setConfirmationMessage("❌ An error occurred during voting.");
        }
    };

    return (
        <div className="connected-page">
            <div className="connected-container">
                <h1>Vote for Your Candidate</h1>

                <div className="candidate-options">
                    {candidates.map((candidate, index) => (
                        <label key={index} className="candidate-card">
                            <input
                                type="radio"
                                name="candidate"
                                value={index}
                                checked={selectedCandidateIndex === index}
                                onChange={() => setSelectedCandidateIndex(index)}
                            />
                            <img
                                src={`https://gateway.pinata.cloud/ipfs/${candidate.imageHash}`}
                                alt={candidate.name}
                                width="100"
                            />
                            <p>
                                {candidate.name} ({candidate.partyName})
                            </p>
                        </label>
                    ))}
                </div>

                <button onClick={castVote} disabled={!isElectionActive}>
                    Vote
                </button>

                {!isElectionActive && <p className="error-message">Voting is Closed.</p>}

                {confirmationMessage && (
                    <p className="confirmation-message">{confirmationMessage}</p>
                )}
            </div>
        </div>
    );
};

export default Connected;
