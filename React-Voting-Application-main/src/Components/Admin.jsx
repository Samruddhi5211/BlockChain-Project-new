import React, { useState, useEffect } from "react";
import { web3, votingContract } from "../Constant/constant";
import axios from "axios";
import "../Components/Admin.css";

const PINATA_API_KEY = "e66b4788288ea5434226";
const PINATA_SECRET_API_KEY = "798e70ca4d1e6cd2d6531d3a4c1e0d4deae62908729866428f7a9f1cbb54a549";

const Admin = () => {
    const [candidates, setCandidates] = useState([]);
    const [newCandidate, setNewCandidate] = useState({ name: "", party: "", image: null });
    const [account, setAccount] = useState("");
    const [votingStarted, setVotingStarted] = useState(false);
    const [votingEnded, setVotingEnded] = useState(false);
    const [currentSection, setCurrentSection] = useState("add");
    const [votingEndTime, setVotingEndTime] = useState(0);
    const [remainingTime, setRemainingTime] = useState(0);
    const [winners, setWinners] = useState([]);

    useEffect(() => {
        loadCandidates();
        loadAccount();
        checkVotingStatus();
    }, []);

    useEffect(() => {
        const updateRemainingTime = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = votingEndTime - now;
            setRemainingTime(Math.max(0, remaining));
            if (remaining <= 0) {
                setVotingEnded(true);
                checkVotingStatus();
                loadCandidates();
            }
        };

        if (votingStarted && !votingEnded) {
            updateRemainingTime();
            const timer = setInterval(updateRemainingTime, 1000);
            return () => clearInterval(timer);
        }
    }, [votingStarted, votingEndTime]);

    const loadAccount = async () => {
        const accounts = await web3.eth.requestAccounts();
        setAccount(accounts[0]);
    };

    const checkVotingStatus = async () => {
        try {
            const status = await votingContract.methods.getVotingStatus().call();
            const endTime = await votingContract.methods.votingEnd().call();
            const now = Math.floor(Date.now() / 1000);

            setVotingStarted(status);
            setVotingEndTime(Number(endTime));
            setVotingEnded(now >= Number(endTime));
        } catch (error) {
            console.error("Error checking voting status:", error);
        }
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
                partyName: parties[index]
            }));

            setCandidates(formattedCandidates);

            if (votingEnded && formattedCandidates.length > 0) {
                const maxVotes = Math.max(...formattedCandidates.map(c => c.voteCount));
                const topCandidates = formattedCandidates.filter(c => c.voteCount === maxVotes);
                setWinners(topCandidates);
            }
        } catch (error) {
            console.error("Error loading candidates:", error);
        }
    };

    const uploadToPinata = async (file) => {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_API_KEY,
                },
            });

            return res.data.IpfsHash;
        } catch (error) {
            console.error("Pinata Upload Error:", error);
            return null;
        }
    };

    const addCandidate = async () => {
        if (!newCandidate.name || !newCandidate.party || !newCandidate.image) {
            return alert("Enter all candidate details.");
        }

        try {
            const imageHash = await uploadToPinata(newCandidate.image);
            if (!imageHash) return alert("Image upload failed.");

            await votingContract.methods.addCandidate(newCandidate.name, imageHash, newCandidate.party).send({ from: account });

            alert("Candidate added successfully!");
            setNewCandidate({ name: "", party: "", image: null });
            loadCandidates();
        } catch (error) {
            console.error("Error adding candidate:", error);
        }
    };

    const startElection = async () => {
        try {
            await votingContract.methods.startElection(1).send({ from: account });
            alert("Election has started!");
            checkVotingStatus();
        } catch (error) {
            console.error("Error starting election:", error);
        }
    };

    return (
        <div className="admin-container">
            <h1>Admin Panel</h1>

            <div className="admin-buttons">
                <button onClick={() => setCurrentSection("add")}>Add Candidate</button>
                <button onClick={() => setCurrentSection("start")}>Start Election</button>
                <button onClick={() => setCurrentSection("result")}>View Results</button>
                <button onClick={() => setCurrentSection("show")}>Show Candidates</button>
            </div>

            {currentSection === "add" && (
                <div className="candidate-form">
                    <h2>Add Candidate</h2>
                    <input type="text" placeholder="Candidate Name" value={newCandidate.name} onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })} />
                    <input type="text" placeholder="Party Name" value={newCandidate.party} onChange={(e) => setNewCandidate({ ...newCandidate, party: e.target.value })} />
                    <input type="file" accept="image/*" onChange={(e) => setNewCandidate({ ...newCandidate, image: e.target.files[0] })} />
                    <button onClick={addCandidate}>Add Candidate</button>
                </div>
            )}

            {currentSection === "start" && (
                <div className="election-status">
                    <h2>Election Status</h2>
                    <p>{votingStarted ? "Election has started!" : "Election has not started yet."}</p>
                    <p>Remaining Time: {remainingTime > 0 ? `${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s` : "Time's up or not started."}</p>
                    <button onClick={startElection} disabled={votingStarted}>{votingStarted ? "Election Started" : "Start Election"}</button>
                </div>
            )}

            {currentSection === "result" && (
                <div className="results-section">
                    <h2>Election Results</h2>
                    {votingEnded ? (
    (() => {
        if (candidates.length === 0) {
            return <p>No candidates available.</p>;
        }

        const maxVotes = Math.max(...candidates.map(c => c.voteCount));
        const topCandidates = candidates.filter(c => c.voteCount === maxVotes);

        if (topCandidates.length > 1) {
            return (
                <div className="winner-card">
                    <h3>It's a tie!</h3>
                    <p>Multiple candidates have the same highest number of votes ({maxVotes} votes each):</p>
                    <div className="tie-candidates">
                        {topCandidates.map((candidate, index) => (
                            <div key={index} className="tie-candidate">
                                {candidate.imageHash && (
                                    <img
                                        src={`https://gateway.pinata.cloud/ipfs/${candidate.imageHash}`}
                                        alt={candidate.name}
                                        width="100"
                                    />
                                )}
                                <p>{candidate.name} ({candidate.partyName})</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        } else {
            const winner = topCandidates[0];
            return (
                <div className="winner-card">
                    {winner.imageHash && (
                        <img
                            src={`https://gateway.pinata.cloud/ipfs/${winner.imageHash}`}
                            alt={winner.name}
                            width="100"
                        />
                    )}
                    <h3>
                        Winner: {winner.name} ({winner.partyName}) with {winner.voteCount} votes
                    </h3>
                </div>
            );
        }
    })()
) : (
    <p>Winner not determined</p>
)}

                </div>
            )}

            {currentSection === "show" && (
                <div className="show-candidates">
                    <h2>Candidate List</h2>
                    <ul>
                        {candidates.length > 0 ? (
                            candidates.map((candidate, index) => (
                                <li key={index}>
                                    <img src={`https://gateway.pinata.cloud/ipfs/${candidate.imageHash}`} alt={candidate.name} width="100" />
                                    <p>{candidate.name} ({candidate.partyName}) - Votes: {candidate.voteCount}</p>
                                </li>
                            ))
                        ) : (
                            <li>No candidates found</li>
                        )}
                    </ul>
                    <p>Remaining Time: {remainingTime > 0 ? `${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s` : "Time's up or not started."}</p>
                </div>
            )}
        </div>
    );
};

export default Admin;
